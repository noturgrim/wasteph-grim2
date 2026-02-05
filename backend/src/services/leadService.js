import { db } from "../db/index.js";
import { leadTable, activityLogTable, inquiryTable } from "../db/schema.js";
import { eq, desc, and, or, like, count } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";
import counterService from "./counterService.js";

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
    const { clientName, company, email, phone, location, notes } = leadData;

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
   * Create a new lead from public landing page submission
   * @param {Object} leadData - Lead data from landing page
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Created lead
   */
  async createPublicLead(leadData, metadata = {}) {
    const { clientName, company, email, phone, location, notes } = leadData;

    // Validate that at least company is provided (required for public submissions)
    if (!company?.trim()) {
      throw new AppError("Company name is required", 400);
    }

    const [lead] = await db
      .insert(leadTable)
      .values({
        clientName: clientName || company, // Use company as clientName fallback
        company,
        email,
        phone,
        location,
        notes,
        isClaimed: false,
      })
      .returning();

    // Log activity without userId for public submissions
    await this.logActivity({
      userId: null,
      action: "lead_created_public",
      entityType: "lead",
      entityId: lead.id,
      details: { source: "landing_page" },
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
      conditions.push(
        eq(leadTable.isClaimed, isClaimed === "true" || isClaimed === true)
      );
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
   * @param {string} source - Optional source (how the lead reached out)
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Created inquiry
   * @throws {AppError} If lead not found or already claimed
   */
  async claimLead(leadId, userId, source, metadata = {}) {
    // First check if lead exists and is not claimed
    const existingLead = await this.getLeadById(leadId);

    if (existingLead.isClaimed) {
      throw new AppError("Lead has already been claimed", 400);
    }

    // Generate unique inquiry number using counter service
    const inquiryNumber = await counterService.getNextInquiryNumber();

    // Create inquiry from lead data
    // Use provided source if available, otherwise leave as null (can be set later)
    // Set isInformationComplete to false since lead data is incomplete
    const [inquiry] = await db
      .insert(inquiryTable)
      .values({
        inquiryNumber,
        name: existingLead.clientName,
        email: existingLead.email || "noemail@wasteph.com", // Required field fallback
        phone: existingLead.phone,
        company: existingLead.company,
        location: existingLead.location || null,
        message:
          existingLead.notes || `Lead from pool: ${existingLead.clientName}`,
        status: "initial_comms",
        source: source || null,
        assignedTo: userId,
        isInformationComplete: false, // Mark as incomplete - needs site visit/contact
      })
      .returning();

    // Mark lead as claimed with a WHERE clause to prevent race conditions
    // This will only update if the lead is still unclaimed
    const [lead] = await db
      .update(leadTable)
      .set({
        isClaimed: true,
        claimedBy: userId,
        claimedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(leadTable.id, leadId), eq(leadTable.isClaimed, false)))
      .returning();

    // If no lead was returned, it means another user already claimed it
    if (!lead) {
      // Delete the inquiry we just created since the claim failed
      await db.delete(inquiryTable).where(eq(inquiryTable.id, inquiry.id));
      throw new AppError(
        "Lead has already been claimed by another user. Please refresh the page.",
        409
      );
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
      details: { source: source || null, fromLeadPool: true, leadId: lead.id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return inquiry;
  }

  /**
   * Delete lead (only if unclaimed)
   * @param {string} leadId - Lead UUID
   * @param {string} userId - User performing the deletion
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Deleted lead
   * @throws {AppError} If lead not found or already claimed
   */
  async deleteLead(leadId, userId, metadata = {}) {
    // Check if lead exists and is unclaimed
    const existingLead = await this.getLeadById(leadId);

    if (existingLead.isClaimed) {
      throw new AppError("Cannot delete claimed lead", 400);
    }

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
   * Bulk delete leads (only unclaimed)
   * @param {Array<string>} leadIds - Array of lead UUIDs to delete
   * @param {string} userId - User performing the deletion
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Result object with success and failure counts
   */
  async bulkDeleteLeads(leadIds, userId, metadata = {}) {
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw new AppError("Lead IDs must be a non-empty array", 400);
    }

    const results = {
      totalRequested: leadIds.length,
      deleted: 0,
      failed: 0,
      errors: [],
    };

    for (const leadId of leadIds) {
      try {
        // Check if lead exists and is unclaimed
        const lead = await this.getLeadById(leadId);

        if (lead.isClaimed) {
          results.failed++;
          results.errors.push({
            leadId,
            reason: "Lead is already claimed and cannot be deleted",
          });
          continue;
        }

        // Delete the lead
        await db.delete(leadTable).where(eq(leadTable.id, leadId));

        // Log activity
        await this.logActivity({
          userId,
          action: "lead_deleted_bulk",
          entityType: "lead",
          entityId: leadId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        });

        results.deleted++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          leadId,
          reason: error.message || "Failed to delete lead",
        });
      }
    }

    return results;
  }

  /**
   * Log activity to activity log table
   * @param {Object} activityData - Activity log data
   * @returns {Promise<void>}
   */
  async logActivity(activityData) {
    const {
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    } = activityData;

    await db.insert(activityLogTable).values({
      userId: userId || null, // Allow null for public/system actions
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
