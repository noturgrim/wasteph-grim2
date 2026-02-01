import { db } from "../db/index.js";
import { clientTable, contractsTable, activityLogTable } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
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
  async getAllClients() {
    const rows = await db
      .select({
        client: clientTable,
        contractStatus: contractsTable.status,
      })
      .from(clientTable)
      .leftJoin(contractsTable, eq(contractsTable.clientId, clientTable.id))
      .orderBy(desc(clientTable.createdAt));

    return rows.map((row) => ({
      ...row.client,
      contractStatus: row.contractStatus || null,
    }));
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
    // Convert date strings to Date objects if present
    if (updateData.contractStartDate) {
      updateData.contractStartDate = new Date(updateData.contractStartDate);
    }
    if (updateData.contractEndDate) {
      updateData.contractEndDate = new Date(updateData.contractEndDate);
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
