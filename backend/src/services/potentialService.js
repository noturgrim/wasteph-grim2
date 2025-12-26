import { db } from "../db/index.js";
import { potentialTable, activityLogTable } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";

/**
 * PotentialService - Business logic layer for potential client operations
 * Follows: Route → Controller → Service → DB architecture
 */
class PotentialService {
  /**
   * Create a new potential client
   * @param {Object} potentialData - Potential data from request
   * @param {string} userId - User creating the potential (auto-assigned)
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Created potential
   */
  async createPotential(potentialData, userId, metadata = {}) {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      city,
      province,
      industry,
      wasteType,
      estimatedVolume,
      source,
      priority,
      notes,
    } = potentialData;

    const [potential] = await db
      .insert(potentialTable)
      .values({
        companyName,
        contactPerson,
        email,
        phone,
        address,
        city,
        province,
        industry,
        wasteType,
        estimatedVolume,
        source,
        priority,
        notes,
        assignedTo: userId, // Auto-assign to creator
      })
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "potential_created",
      entityType: "potential",
      entityId: potential.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return potential;
  }

  /**
   * Get all potentials
   * @returns {Promise<Array>} Array of potentials
   */
  async getAllPotentials() {
    const potentials = await db
      .select()
      .from(potentialTable)
      .orderBy(desc(potentialTable.createdAt));

    return potentials;
  }

  /**
   * Get potential by ID
   * @param {string} potentialId - Potential UUID
   * @returns {Promise<Object>} Potential object
   * @throws {AppError} If potential not found
   */
  async getPotentialById(potentialId) {
    const [potential] = await db
      .select()
      .from(potentialTable)
      .where(eq(potentialTable.id, potentialId))
      .limit(1);

    if (!potential) {
      throw new AppError("Potential client not found", 404);
    }

    return potential;
  }

  /**
   * Update potential
   * @param {string} potentialId - Potential UUID
   * @param {Object} updateData - Fields to update
   * @param {string} userId - User performing the update
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Updated potential
   * @throws {AppError} If potential not found
   */
  async updatePotential(potentialId, updateData, userId, metadata = {}) {
    const [potential] = await db
      .update(potentialTable)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(potentialTable.id, potentialId))
      .returning();

    if (!potential) {
      throw new AppError("Potential client not found", 404);
    }

    // Log activity
    await this.logActivity({
      userId,
      action: "potential_updated",
      entityType: "potential",
      entityId: potential.id,
      details: updateData,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return potential;
  }

  /**
   * Delete potential
   * @param {string} potentialId - Potential UUID
   * @param {string} userId - User performing the deletion
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Deleted potential
   * @throws {AppError} If potential not found
   */
  async deletePotential(potentialId, userId, metadata = {}) {
    const [potential] = await db
      .delete(potentialTable)
      .where(eq(potentialTable.id, potentialId))
      .returning();

    if (!potential) {
      throw new AppError("Potential client not found", 404);
    }

    // Log activity
    await this.logActivity({
      userId,
      action: "potential_deleted",
      entityType: "potential",
      entityId: potential.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return potential;
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

export default PotentialService;
