import { db } from "../db/index.js";
import { clientTable, contractsTable, activityLogTable } from "../db/schema.js";
import { eq, desc, and, like, or, count, sql, inArray } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";

/**
 * ClientService - Business logic layer for contracted client operations
 * Follows: Route → Controller → Service → DB architecture
 */
class ClientService {
  /**
   * Create a new contracted client
   * @param {Object} clientData - Client data from request
   * @param {string} userId - User creating the client (becomes account manager)
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Created client
   */
  async createClient(clientData, userId, metadata = {}) {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      city,
      province,
      industry,
      wasteTypes,
      contractStartDate,
      contractEndDate,
      notes,
    } = clientData;

    const [client] = await db
      .insert(clientTable)
      .values({
        companyName,
        contactPerson,
        email,
        phone,
        address,
        city,
        province,
        industry,
        wasteTypes,
        contractStartDate: contractStartDate
          ? new Date(contractStartDate)
          : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        notes,
        accountManager: userId, // Auto-assign to creator
      })
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "client_created",
      entityType: "client",
      entityId: client.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return client;
  }

  /**
   * Get all clients
   * @returns {Promise<Array>} Array of clients
   */
  async getAllClients(options = {}) {
    const { status, search, page: rawPage = 1, limit: rawLimit = 10 } = options;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      conditions.push(
        statuses.length === 1
          ? eq(clientTable.status, statuses[0])
          : inArray(clientTable.status, statuses),
      );
    }

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      conditions.push(
        or(
          like(clientTable.companyName, `%${escaped}%`),
          like(clientTable.contactPerson, `%${escaped}%`),
          like(clientTable.email, `%${escaped}%`),
          like(clientTable.city, `%${escaped}%`),
          like(clientTable.province, `%${escaped}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Single query: data + count via window function
    const rows = await db
      .select({
        id: clientTable.id,
        companyName: clientTable.companyName,
        contactPerson: clientTable.contactPerson,
        email: clientTable.email,
        phone: clientTable.phone,
        address: clientTable.address,
        city: clientTable.city,
        province: clientTable.province,
        industry: clientTable.industry,
        wasteTypes: clientTable.wasteTypes,
        contractStartDate: clientTable.contractStartDate,
        contractEndDate: clientTable.contractEndDate,
        status: clientTable.status,
        accountManager: clientTable.accountManager,
        notes: clientTable.notes,
        createdAt: clientTable.createdAt,
        updatedAt: clientTable.updatedAt,
        totalCount: sql`(count(*) over())::int`,
      })
      .from(clientTable)
      .where(whereClause)
      .orderBy(desc(clientTable.createdAt))
      .limit(limit)
      .offset(offset);

    const total = rows.length > 0 ? rows[0].totalCount : 0;
    const clientIds = rows.map((c) => c.id);

    // Batch fetch latest contract status per client (only if we have clients)
    const contractMap = new Map();
    if (clientIds.length > 0) {
      // Use DISTINCT ON to get only the latest contract per client in one query
      const latestContracts = await db
        .selectDistinctOn([contractsTable.clientId], {
          clientId: contractsTable.clientId,
          status: contractsTable.status,
        })
        .from(contractsTable)
        .where(inArray(contractsTable.clientId, clientIds))
        .orderBy(contractsTable.clientId, desc(contractsTable.createdAt));

      latestContracts.forEach((c) => contractMap.set(c.clientId, c.status));
    }

    // Strip totalCount and attach contract status
    const data = rows.map(({ totalCount, ...client }) => ({
      ...client,
      contractStatus: contractMap.get(client.id) || null,
    }));

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get client by ID
   * @param {string} clientId - Client UUID
   * @returns {Promise<Object>} Client object
   * @throws {AppError} If client not found
   */
  async getClientById(clientId) {
    const [client] = await db
      .select()
      .from(clientTable)
      .where(eq(clientTable.id, clientId))
      .limit(1);

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    return client;
  }

  /**
   * Update client
   * @param {string} clientId - Client UUID
   * @param {Object} updateData - Fields to update
   * @param {string} userId - User performing the update
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Updated client
   * @throws {AppError} If client not found
   */
  async updateClient(clientId, updateData, userId, metadata = {}) {
    // Convert date strings to Date objects, or null if empty
    if ("contractStartDate" in updateData) {
      updateData.contractStartDate = updateData.contractStartDate ? new Date(updateData.contractStartDate) : null;
    }
    if ("contractEndDate" in updateData) {
      updateData.contractEndDate = updateData.contractEndDate ? new Date(updateData.contractEndDate) : null;
    }

    const [client] = await db
      .update(clientTable)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(clientTable.id, clientId))
      .returning();

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    // Log activity
    await this.logActivity({
      userId,
      action: "client_updated",
      entityType: "client",
      entityId: client.id,
      details: updateData,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return client;
  }

  /**
   * Delete client
   * @param {string} clientId - Client UUID
   * @param {string} userId - User performing the deletion
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Deleted client
   * @throws {AppError} If client not found
   */
  async deleteClient(clientId, userId, metadata = {}) {
    const [client] = await db
      .delete(clientTable)
      .where(eq(clientTable.id, clientId))
      .returning();

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    // Log activity
    await this.logActivity({
      userId,
      action: "client_deleted",
      entityType: "client",
      entityId: client.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return client;
  }

  /**
   * Log activity to activity log table
   * @param {Object} activityData - Activity log data
   * @returns {Promise<void>}
   */
  async logActivity(activityData) {
    const { userId, action, entityType, entityId, details, ipAddress, userAgent } =
      activityData;

    await db.insert(activityLogTable).values({
      userId,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
    });
  }
}

export default ClientService;
