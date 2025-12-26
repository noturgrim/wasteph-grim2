import { db } from "../db/index.js";
import { inquiryTable, activityLogTable } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";

/**
 * InquiryService - Business logic layer for inquiry operations
 * Follows: Route → Controller → Service → DB architecture
 */
class InquiryService {
  /**
   * Create a new inquiry
   * @param {Object} inquiryData - Inquiry data from request
   * @param {Object} options - Optional parameters (userId, source, etc.)
   * @returns {Promise<Object>} Created inquiry
   */
  async createInquiry(inquiryData, options = {}) {
    const { name, email, phone, company, message } = inquiryData;
    const { source = "website" } = options;

    const [inquiry] = await db
      .insert(inquiryTable)
      .values({
        name,
        email,
        phone,
        company,
        message,
        source,
      })
      .returning();

    return inquiry;
  }

  /**
   * Get all inquiries with optional filtering
   * @returns {Promise<Array>} Array of inquiries
   */
  async getAllInquiries() {
    const inquiries = await db
      .select()
      .from(inquiryTable)
      .orderBy(desc(inquiryTable.createdAt));

    return inquiries;
  }

  /**
   * Get inquiry by ID
   * @param {string} inquiryId - Inquiry UUID
   * @returns {Promise<Object>} Inquiry object
   * @throws {AppError} If inquiry not found
   */
  async getInquiryById(inquiryId) {
    const [inquiry] = await db
      .select()
      .from(inquiryTable)
      .where(eq(inquiryTable.id, inquiryId))
      .limit(1);

    if (!inquiry) {
      throw new AppError("Inquiry not found", 404);
    }

    return inquiry;
  }

  /**
   * Update inquiry
   * @param {string} inquiryId - Inquiry UUID
   * @param {Object} updateData - Fields to update
   * @param {string} userId - User performing the update
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Updated inquiry
   * @throws {AppError} If inquiry not found
   */
  async updateInquiry(inquiryId, updateData, userId, metadata = {}) {
    const { status, assignedTo, notes } = updateData;

    const [inquiry] = await db
      .update(inquiryTable)
      .set({
        ...(status && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(eq(inquiryTable.id, inquiryId))
      .returning();

    if (!inquiry) {
      throw new AppError("Inquiry not found", 404);
    }

    // Log activity
    await this.logActivity({
      userId,
      action: "inquiry_updated",
      entityType: "inquiry",
      entityId: inquiry.id,
      details: { status, assignedTo, notes },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return inquiry;
  }

  /**
   * Delete inquiry
   * @param {string} inquiryId - Inquiry UUID
   * @param {string} userId - User performing the deletion
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Deleted inquiry
   * @throws {AppError} If inquiry not found
   */
  async deleteInquiry(inquiryId, userId, metadata = {}) {
    const [inquiry] = await db
      .delete(inquiryTable)
      .where(eq(inquiryTable.id, inquiryId))
      .returning();

    if (!inquiry) {
      throw new AppError("Inquiry not found", 404);
    }

    // Log activity
    await this.logActivity({
      userId,
      action: "inquiry_deleted",
      entityType: "inquiry",
      entityId: inquiry.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return inquiry;
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

export default InquiryService;
