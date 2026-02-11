import { db } from "../db/index.js";
import { userTable, activityLogTable } from "../db/schema.js";
import { eq, and, or, like, inArray, count, sql } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
import { deleteObject } from "./s3Service.js";

const userSelect = {
  id: userTable.id,
  email: userTable.email,
  firstName: userTable.firstName,
  lastName: userTable.lastName,
  role: userTable.role,
  isMasterSales: userTable.isMasterSales,
  isActive: userTable.isActive,
  profilePictureUrl: userTable.profilePictureUrl,
  createdAt: userTable.createdAt,
  updatedAt: userTable.updatedAt,
};

class UserService {
  async getAllUsers(filters = {}) {
    const { includeInactive, role, search, page: rawPage = 1, limit: rawLimit = 10 } = filters;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (!includeInactive) {
      conditions.push(eq(userTable.isActive, true));
    }

    if (role) {
      const roles = role.split(",");
      conditions.push(roles.length === 1 ? eq(userTable.role, roles[0]) : inArray(userTable.role, roles));
    }

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      const searchTerm = `%${escaped}%`;
      conditions.push(
        or(
          like(sql`${userTable.firstName} || ' ' || ${userTable.lastName}`, searchTerm),
          like(userTable.email, searchTerm)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Active filter for facets (same as default behavior)
    const facetFilter = includeInactive ? sql`1=1` : sql`is_active = true`;

    const [[{ value: total }], users, facetRows] = await Promise.all([
      db.select({ value: count() }).from(userTable).where(whereClause),
      db.select(userSelect).from(userTable).where(whereClause).orderBy(userTable.firstName).limit(limit).offset(offset),
      // Role facet counts (NOT role-filtered)
      db.execute(sql`
        SELECT role::text AS facet_value, count(*)::int AS cnt
        FROM "user"
        WHERE ${facetFilter}
        GROUP BY role
      `),
    ]);

    const facets = { role: {} };
    for (const row of facetRows) {
      if (row.facet_value) {
        facets.role[row.facet_value] = row.cnt;
      }
    }

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      facets,
    };
  }

  async getUserById(userId) {
    const [user] = await db
      .select(userSelect)
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    return user;
  }

  async createUser({ email, hashedPassword, firstName, lastName, role, isMasterSales }) {
    const userId = generateIdFromEntropySize(10);

    const [user] = await db
      .insert(userTable)
      .values({
        id: userId,
        email,
        hashedPassword,
        firstName,
        lastName,
        role: role || "sales",
        isMasterSales: isMasterSales || false,
        isActive: true,
      })
      .returning(userSelect);

    return user;
  }

  async updateUser(userId, updates) {
    updates.updatedAt = sql`NOW()`;

    const [user] = await db
      .update(userTable)
      .set(updates)
      .where(eq(userTable.id, userId))
      .returning(userSelect);

    return user || null;
  }

  async deleteUser(userId) {
    const [deleted] = await db
      .delete(userTable)
      .where(eq(userTable.id, userId))
      .returning(userSelect);

    return deleted || null;
  }

  async updateProfilePicture(userId, profilePictureUrl, updatedBy, metadata) {
    // Get current user to check for existing profile picture
    const [currentUser] = await db
      .select({ profilePictureUrl: userTable.profilePictureUrl })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!currentUser) {
      return null;
    }

    // Delete old profile picture from S3 if it exists
    if (currentUser.profilePictureUrl) {
      try {
        await deleteObject(currentUser.profilePictureUrl);
      } catch (error) {
        console.error("Error deleting old profile picture from S3:", error);
        // Continue with update even if deletion fails
      }
    }

    // Update user with new profile picture
    const [user] = await db
      .update(userTable)
      .set({
        profilePictureUrl,
        updatedAt: sql`NOW()`,
      })
      .where(eq(userTable.id, userId))
      .returning(userSelect);

    // Log activity
    await this._logActivity(
      updatedBy,
      "user_profile_picture_updated",
      "user",
      userId,
      { profilePictureUrl },
      metadata
    );

    return user || null;
  }

  async _logActivity(userId, action, entityType, entityId, details, metadata = {}) {
    try {
      await db.insert(activityLogTable).values({
        userId,
        action,
        entityType,
        entityId,
        details: JSON.stringify(details),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });
    } catch (error) {
      console.error("Activity log error:", error);
    }
  }
}

export default new UserService();
