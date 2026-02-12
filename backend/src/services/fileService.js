import { db } from "../db/index.js";
import { userFilesTable, userTable } from "../db/schema.js";
import { eq, desc, and, or, ilike, inArray, count, gte, lte } from "drizzle-orm";
import { getPresignedUrl } from "./s3Service.js";
import { AppError } from "../middleware/errorHandler.js";

class FileService {
  /**
   * Log a file event (called by other services after file operations).
   * Fire-and-forget — errors are logged but do not break the calling operation.
   */
  async logFile(fileData) {
    try {
      await db.insert(userFilesTable).values({
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        fileType: fileData.fileType || "application/pdf",
        fileSize: fileData.fileSize || null,
        entityType: fileData.entityType,
        entityId: fileData.entityId,
        relatedEntityNumber: fileData.relatedEntityNumber || null,
        clientName: fileData.clientName || null,
        action: fileData.action,
        uploadedBy: fileData.uploadedBy || null,
      });
    } catch (error) {
      console.error("[FileService] Failed to log file:", error.message);
    }
  }

  /**
   * Build role-based WHERE conditions
   */
  _buildRoleConditions(userId, userRole, isMasterSales) {
    if (
      userRole === "super_admin" ||
      (userRole === "sales" && isMasterSales)
    ) {
      // See all files
      return null;
    }

    if (userRole === "admin") {
      // All proposal/contract files + own ticket attachments
      return or(
        inArray(userFilesTable.entityType, [
          "proposal",
          "contract",
          "signed_contract",
          "hardbound_contract",
          "custom_template",
        ]),
        eq(userFilesTable.uploadedBy, userId)
      );
    }

    // Regular sales, social_media, or any other role — own files only
    return eq(userFilesTable.uploadedBy, userId);
  }

  /**
   * Get files with pagination, filtering, and role-based access
   */
  async getFiles(options, userId, userRole, isMasterSales) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const offset = (page - 1) * limit;
    const { entityType: entityTypeFilter, search, dateFrom, dateTo } = options;

    // Build WHERE conditions
    const conditions = [];

    const roleCondition = this._buildRoleConditions(
      userId,
      userRole,
      isMasterSales
    );
    if (roleCondition) conditions.push(roleCondition);

    // Date filter (createdAt) - expect YYYY-MM-DD strings
    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00.000Z`);
      conditions.push(gte(userFilesTable.createdAt, from));
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59.999Z`);
      conditions.push(lte(userFilesTable.createdAt, to));
    }

    // Entity type filter
    if (entityTypeFilter) {
      const types = entityTypeFilter.split(",");
      if (types.length === 1) {
        conditions.push(eq(userFilesTable.entityType, types[0]));
      } else {
        conditions.push(inArray(userFilesTable.entityType, types));
      }
    }

    // Search filter (file name, entity number, client name)
    if (search) {
      conditions.push(
        or(
          ilike(userFilesTable.fileName, `%${search}%`),
          ilike(userFilesTable.relatedEntityNumber, `%${search}%`),
          ilike(userFilesTable.clientName, `%${search}%`)
        )
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Build facet conditions (role + search + date, excluding entityType filter)
    const facetConditions = [];
    if (roleCondition) facetConditions.push(roleCondition);
    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00.000Z`);
      facetConditions.push(gte(userFilesTable.createdAt, from));
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59.999Z`);
      facetConditions.push(lte(userFilesTable.createdAt, to));
    }
    if (search) {
      facetConditions.push(
        or(
          ilike(userFilesTable.fileName, `%${search}%`),
          ilike(userFilesTable.relatedEntityNumber, `%${search}%`),
          ilike(userFilesTable.clientName, `%${search}%`)
        )
      );
    }
    const facetWhere =
      facetConditions.length > 0 ? and(...facetConditions) : undefined;

    // Run count, data, and facet queries in parallel
    const [countResult, files, facetResult] = await Promise.all([
      db
        .select({ value: count() })
        .from(userFilesTable)
        .where(whereClause),
      db
        .select({
          id: userFilesTable.id,
          fileName: userFilesTable.fileName,
          fileUrl: userFilesTable.fileUrl,
          fileType: userFilesTable.fileType,
          fileSize: userFilesTable.fileSize,
          entityType: userFilesTable.entityType,
          entityId: userFilesTable.entityId,
          relatedEntityNumber: userFilesTable.relatedEntityNumber,
          clientName: userFilesTable.clientName,
          action: userFilesTable.action,
          uploadedBy: userFilesTable.uploadedBy,
          createdAt: userFilesTable.createdAt,
          uploaderFirstName: userTable.firstName,
          uploaderLastName: userTable.lastName,
        })
        .from(userFilesTable)
        .leftJoin(userTable, eq(userFilesTable.uploadedBy, userTable.id))
        .where(whereClause)
        .orderBy(desc(userFilesTable.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({
          entityType: userFilesTable.entityType,
          count: count(),
        })
        .from(userFilesTable)
        .where(facetWhere)
        .groupBy(userFilesTable.entityType),
    ]);

    const total = countResult[0]?.value || 0;

    const facets = {
      entityType: Object.fromEntries(
        facetResult.map((r) => [r.entityType, Number(r.count)])
      ),
    };

    return {
      data: files,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      facets,
    };
  }

  /**
   * Get a presigned download URL for a file
   */
  async getFileDownloadUrl(fileId, userId, userRole, isMasterSales) {
    const [file] = await db
      .select()
      .from(userFilesTable)
      .where(eq(userFilesTable.id, fileId))
      .limit(1);

    if (!file) {
      throw new AppError("File not found", 404);
    }

    // Role-based access check
    if (
      userRole === "super_admin" ||
      (userRole === "sales" && isMasterSales)
    ) {
      // Full access
    } else if (userRole === "admin") {
      const isProposalOrContract = [
        "proposal",
        "contract",
        "signed_contract",
        "hardbound_contract",
        "custom_template",
      ].includes(file.entityType);
      if (!isProposalOrContract && file.uploadedBy !== userId) {
        throw new AppError("Access denied", 403);
      }
    } else {
      // Regular sales, social_media, etc.
      if (file.uploadedBy !== userId) {
        throw new AppError("Access denied", 403);
      }
    }

    const downloadUrl = await getPresignedUrl(file.fileUrl, 900);

    return {
      downloadUrl,
      fileName: file.fileName,
      fileType: file.fileType,
    };
  }
}

export default new FileService();
