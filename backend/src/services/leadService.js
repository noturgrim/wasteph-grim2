import { db } from "../db/index.js";
import { leadTable, activityLogTable } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";

/**
 * LeadService - Business logic layer for lead operations
 * Follows: Route → Controller → Service → DB architecture
 */
class LeadService {
  /**
   * Create a new lead
   * @param {Object} leadData - Lead data from request
   * @param {string} userId - User creating the lead (auto-assigned)
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Created lead
   */
  async createLead(leadData, userId, metadata = {}) {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      city,
      province,
      wasteType,
      estimatedVolume,
      priority,
      estimatedValue,
      notes,
    } = leadData;

    const [lead] = await db
      .insert(leadTable)
      .values({
        companyName,
        contactPerson,
        email,
        phone,
        address,
        city,
        province,
        wasteType,
        estimatedVolume,
        priority,
        estimatedValue,
        notes,
        assignedTo: userId, // Auto-assign to creator
      })
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "lead_created",
      entityType: "lead",
      entityId: lead.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return lead;
  }

  /**
   * Get all leads
   * @returns {Promise<Array>} Array of leads
   */
  async getAllLeads() {
    const leads = await db
      .select()
      .from(leadTable)
      .orderBy(desc(leadTable.createdAt));

    return leads;
  }

  /**
   * Get lead by ID
   * @param {string} leadId - Lead UUID
   * @returns {Promise<Object>} Lead object
   * @throws {AppError} If lead not found
   */
  async getLeadById(leadId) {
    const [lead] = await db
      .select()
      .from(leadTable)
      .where(eq(leadTable.id, leadId))
      .limit(1);

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    return lead;
  }

  /**
   * Update lead
   * @param {string} leadId - Lead UUID
   * @param {Object} updateData - Fields to update
   * @param {string} userId - User performing the update
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Updated lead
   * @throws {AppError} If lead not found
   */
  async updateLead(leadId, updateData, userId, metadata = {}) {
    const [lead] = await db
      .update(leadTable)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(leadTable.id, leadId))
      .returning();

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    // Log activity
    await this.logActivity({
      userId,
      action: "lead_updated",
      entityType: "lead",
      entityId: lead.id,
      details: updateData,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return lead;
  }

  /**
   * Delete lead
   * @param {string} leadId - Lead UUID
   * @param {string} userId - User performing the deletion
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Deleted lead
   * @throws {AppError} If lead not found
   */
  async deleteLead(leadId, userId, metadata = {}) {
    const [lead] = await db
      .delete(leadTable)
      .where(eq(leadTable.id, leadId))
      .returning();

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    // Log activity
    await this.logActivity({
      userId,
      action: "lead_deleted",
      entityType: "lead",
      entityId: lead.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return lead;
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

export default LeadService;
