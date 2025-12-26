import { db } from "../db/index.js";
import { inquiryTable, activityLogTable, leadTable } from "../db/schema.js";
import { eq, desc, and, or, like, inArray } from "drizzle-orm";
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
    const { name, email, phone, company, message, source, status, assignedTo, notes } = updateData;

    const [inquiry] = await db
      .update(inquiryTable)
      .set({
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(message && { message }),
        ...(source && { source }),
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
      details: { name, email, phone, company, message, source, status, assignedTo, notes },
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
   * Create inquiry manually (from phone/FB/email by Sales)
   * @param {Object} inquiryData - Inquiry data from request
   * @param {string} userId - User creating the inquiry (auto-assigned)
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Created inquiry
   */
  async createInquiryManual(inquiryData, userId, metadata = {}) {
    const { name, email, phone, company, message, source = "phone" } = inquiryData;

    const [inquiry] = await db
      .insert(inquiryTable)
      .values({
        name,
        email,
        phone,
        company,
        message,
        source,
        assignedTo: userId, // Auto-assign to creator
      })
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "inquiry_created_manual",
      entityType: "inquiry",
      entityId: inquiry.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return inquiry;
  }

  /**
   * Get all inquiries with filtering and search
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Filtered inquiries array
   */
  async getAllInquiriesFiltered(filters = {}) {
    const { status, assignedTo, search, source } = filters;

    let query = db.select().from(inquiryTable);

    const conditions = [];

    // Status filter - support multiple statuses (comma-separated)
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        conditions.push(eq(inquiryTable.status, statuses[0]));
      } else {
        conditions.push(inArray(inquiryTable.status, statuses));
      }
    }

    // Assigned to filter
    if (assignedTo) {
      conditions.push(eq(inquiryTable.assignedTo, assignedTo));
    }

    // Source filter - support multiple sources (comma-separated)
    if (source) {
      const sources = source.split(',').map(s => s.trim());
      if (sources.length === 1) {
        conditions.push(eq(inquiryTable.source, sources[0]));
      } else {
        conditions.push(inArray(inquiryTable.source, sources));
      }
    }

    // Search filter (name, email, company)
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(inquiryTable.name, searchTerm),
          like(inquiryTable.email, searchTerm),
          like(inquiryTable.company, searchTerm)
        )
      );
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order by creation date
    const inquiries = await query.orderBy(desc(inquiryTable.createdAt));

    return inquiries;
  }

  /**
   * Convert inquiry to lead (simple one-click conversion)
   * @param {string} inquiryId - Inquiry UUID
   * @param {string} userId - User performing the conversion
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Created lead object
   * @throws {AppError} If inquiry not found
   */
  async convertInquiryToLead(inquiryId, userId, metadata = {}) {
    // 1. Fetch inquiry
    const inquiry = await this.getInquiryById(inquiryId);

    // 2. Validate inquiry can be converted (warn if not qualified)
    if (inquiry.status !== "qualified") {
      console.warn(
        `Converting inquiry ${inquiryId} with status '${inquiry.status}' (recommended: 'qualified')`
      );
    }

    // 3. Create lead with mapped fields
    const [lead] = await db
      .insert(leadTable)
      .values({
        companyName: inquiry.company || inquiry.name, // Use company name or fallback to person name
        contactPerson: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        notes: `Converted from inquiry.\n\nOriginal message: ${inquiry.message}`,
        assignedTo: inquiry.assignedTo || userId, // Keep same assignment or assign to converter
        status: "new",
        priority: 3, // Default priority
        // Leave empty: address, city, province, wasteType, estimatedVolume, estimatedValue
      })
      .returning();

    // 4. Update inquiry status to converted
    await db
      .update(inquiryTable)
      .set({ status: "converted", updatedAt: new Date() })
      .where(eq(inquiryTable.id, inquiryId));

    // 5. Log activities for both inquiry and lead
    await this.logActivity({
      userId,
      action: "inquiry_converted_to_lead",
      entityType: "inquiry",
      entityId: inquiry.id,
      details: { leadId: lead.id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    await db.insert(activityLogTable).values({
      userId,
      action: "lead_created_from_inquiry",
      entityType: "lead",
      entityId: lead.id,
      details: JSON.stringify({ inquiryId: inquiry.id }),
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

export default InquiryService;
