import { db } from "../db/index.js";
import {
  leadTable,
  activityLogTable,
  inquiryTable,
  userTable,
} from "../db/schema.js";
import { eq, desc, and, or, like, count, inArray } from "drizzle-orm";
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

    // Fire-and-forget: don't block response for activity logging
    this._logInBackground({
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

    if (!company?.trim()) {
      throw new AppError("Company name is required", 400);
    }

    const [lead] = await db
      .insert(leadTable)
      .values({
        clientName: clientName || company,
        company,
        email,
        phone,
        location,
        notes,
        isClaimed: false,
      })
      .returning();

    // Fire-and-forget: don't block response for activity logging
    this._logInBackground({
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
    const {
      isClaimed,
      claimedBy,
      search,
      page: rawPage = 1,
      limit: rawLimit = 10,
    } = options;

    // Coerce to numbers to prevent string concatenation bugs
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];

    if (isClaimed !== undefined) {
      conditions.push(
        eq(leadTable.isClaimed, isClaimed === "true" || isClaimed === true)
      );
    }

    if (claimedBy) {
      conditions.push(eq(leadTable.claimedBy, claimedBy));
    }

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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Run count + data queries in parallel
    const [countResult, leads] = await Promise.all([
      db
        .select({ value: count() })
        .from(leadTable)
        .where(whereClause),
      db
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
        .leftJoin(userTable, eq(leadTable.claimedBy, userTable.id))
        .where(whereClause)
        .orderBy(desc(leadTable.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0].value;

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
    // Run lead check + counter generation in parallel (they're independent)
    const [existingLead, inquiryNumber] = await Promise.all([
      this.getLeadById(leadId),
      counterService.getNextInquiryNumber(),
    ]);

    if (existingLead.isClaimed) {
      throw new AppError("Lead has already been claimed", 400);
    }

    // Create inquiry from lead data
    const [inquiry] = await db
      .insert(inquiryTable)
      .values({
        inquiryNumber,
        name: existingLead.clientName,
        email: existingLead.email || "noemail@wasteph.com",
        phone: existingLead.phone,
        company: existingLead.company,
        location: existingLead.location || null,
        message:
          existingLead.notes || `Lead from pool: ${existingLead.clientName}`,
        status: "initial_comms",
        source: source || "lead-pool",
        assignedTo: userId,
        isInformationComplete: false,
      })
      .returning();

    // Atomic claim — only succeeds if lead is still unclaimed (race-condition safe)
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

    if (!lead) {
      // Claim lost the race — clean up the inquiry we just created
      await db.delete(inquiryTable).where(eq(inquiryTable.id, inquiry.id));
      throw new AppError(
        "Lead has already been claimed by another user. Please refresh the page.",
        409
      );
    }

    // Fire-and-forget: batch both activity logs in a single INSERT
    db.insert(activityLogTable)
      .values([
        {
          userId,
          action: "lead_claimed",
          entityType: "lead",
          entityId: lead.id,
          details: null,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
        {
          userId,
          action: "inquiry_created",
          entityType: "inquiry",
          entityId: inquiry.id,
          details: JSON.stringify({
            source: source || "lead-pool",
            fromLeadPool: true,
            leadId: lead.id,
          }),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      ])
      .catch((err) =>
        console.error("[LeadService] Background claim activity log failed:", err.message)
      );

    return { inquiry, lead };
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
   * OPTIMIZED: Single query to delete all unclaimed leads instead of N+1
   * @param {Array<string>} leadIds - Array of lead UUIDs to delete
   * @param {string} userId - User performing the deletion
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Result object with success and failure counts
   */
  async bulkDeleteLeads(leadIds, userId, metadata = {}) {
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw new AppError("Lead IDs must be a non-empty array", 400);
    }

    // Single query: delete all requested leads that are unclaimed
    const deletedLeads = await db
      .delete(leadTable)
      .where(
        and(
          inArray(leadTable.id, leadIds),
          eq(leadTable.isClaimed, false)
        )
      )
      .returning({ id: leadTable.id });

    const deletedCount = deletedLeads.length;
    const failedCount = leadIds.length - deletedCount;

    // Batch log activity for all deleted leads
    if (deletedCount > 0) {
      const activityLogs = deletedLeads.map((lead) => ({
        userId,
        action: "lead_deleted_bulk",
        entityType: "lead",
        entityId: lead.id,
        details: null,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      }));

      await db.insert(activityLogTable).values(activityLogs);
    }

    return {
      totalRequested: leadIds.length,
      deleted: deletedCount,
      failed: failedCount,
      errors: failedCount > 0
        ? [{ reason: `${failedCount} lead(s) were already claimed or not found` }]
        : [],
    };
  }

  /**
   * Fire-and-forget activity log — does not block the caller.
   * Errors are caught and logged to stderr so they never crash the request.
   * @param {Object} activityData - Activity log data
   */
  _logInBackground(activityData) {
    this.logActivity(activityData).catch((err) =>
      console.error("[LeadService] Background activity log failed:", err.message)
    );
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
