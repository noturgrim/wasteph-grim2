import { db } from "../db/index.js";
import { userTable } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";

const userSelect = {
  id: userTable.id,
  email: userTable.email,
  firstName: userTable.firstName,
  lastName: userTable.lastName,
  role: userTable.role,
  isMasterSales: userTable.isMasterSales,
  isActive: userTable.isActive,
  createdAt: userTable.createdAt,
  updatedAt: userTable.updatedAt,
};

class UserService {
  async getAllUsers(filters = {}) {
    const conditions = [];

    if (!filters.includeInactive) {
      conditions.push(eq(userTable.isActive, true));
    }

    if (filters.role) {
      conditions.push(eq(userTable.role, filters.role));
    }

    const query = db.select(userSelect).from(userTable).orderBy(userTable.firstName);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    return await query;
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
}

export default new UserService();
