import { db } from "../db/index.js";
import { leadTable, activityLogTable, inquiryTable } from "../db/schema.js";
import { eq, desc, and, or, like, count } from "drizzle-orm";
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
      clientName,
      company,
      email,
      phone,
      location,
      notes,
    } = leadData;

    const [lead] = await db
      .insert(leadTable)
      .values({
        clientName,
        company,
        email,
        phone,
        location,
        notes,
        isClaimed: false,
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
   * Get all leads with optional filtering, search, and pagination
   * @param {Object} options - Query options { status, assignedTo, search, page, limit }
   * @returns {Promise<Object>} Object with data and pagination info
   */
  async getAllLeads(options = {}) {
    const { isClaimed, claimedBy, search, page = 1, limit = 10 } = options;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Import userTable for join
    const { userTable } = await import("../db/schema.js");

    // Build base query with user join for claimedBy
    let query = db
      .select({
        id: leadTable.id,
        clientName: leadTable.clientName,
        company: leadTable.company,
        email: leadTable.email,
        phone: leadTable.phone,
        location: leadTable.location,
        notes: leadTable.notes,
        isClaimed: leadTable.isClaimed,
        claimedBy: leadTable.claimedBy,
        claimedAt: leadTable.claimedAt,
        createdAt: leadTable.createdAt,
        updatedAt: leadTable.updatedAt,
        claimedByUser: {
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
        },
      })
      .from(leadTable)
      .leftJoin(userTable, eq(leadTable.claimedBy, userTable.id));
    const conditions = [];

    // Filter by claimed status
    if (isClaimed !== undefined) {
      conditions.push(eq(leadTable.isClaimed, isClaimed === 'true' || isClaimed === true));
    }

    // Claimed by filter
    if (claimedBy) {
      conditions.push(eq(leadTable.claimedBy, claimedBy));
    }

    // Search filter (clientName, company, email)
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(leadTable.clientName, searchTerm),
          like(leadTable.company, searchTerm),
          like(leadTable.email, searchTerm)
        )
      );
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count for pagination
    let countQuery = db.select({ value: count() }).from(leadTable);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ value: total }] = await countQuery;

    // Order by creation date and apply pagination
    const leads = await query
      .orderBy(desc(leadTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
   * Claim a lead and convert to inquiry
   * @param {string} leadId - Lead UUID
   * @param {string} userId - User claiming the lead
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Created inquiry
   * @throws {AppError} If lead not found or already claimed
   */
  async claimLead(leadId, userId, metadata = {}) {
    // First check if lead exists and is not claimed
    const existingLead = await this.getLeadById(leadId);

    if (existingLead.isClaimed) {
      throw new AppError("Lead has already been claimed", 400);
    }

    // Create inquiry from lead data
    const [inquiry] = await db
      .insert(inquiryTable)
      .values({
        name: existingLead.clientName,
        email: existingLead.email || "noemail@wasteph.com", // Required field fallback
        phone: existingLead.phone,
        company: existingLead.company,
        message: existingLead.notes || `Lead from pool: ${existingLead.clientName}`,
        status: "initial_comms",
        source: "lead_pool",
        assignedTo: userId,
        notes: existingLead.location ? `Location: ${existingLead.location}` : null,
      })
      .returning();

    // Mark lead as claimed
    const [lead] = await db
      .update(leadTable)
      .set({
        isClaimed: true,
        claimedBy: userId,
        claimedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leadTable.id, leadId))
      .returning();

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    // Log lead claimed activity
    await this.logActivity({
      userId,
      action: "lead_claimed",
      entityType: "lead",
      entityId: lead.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    // Log inquiry created activity
    await this.logActivity({
      userId,
      action: "inquiry_created",
      entityType: "inquiry",
      entityId: inquiry.id,
      details: { source: "lead_pool", leadId: lead.id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return inquiry;
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
