import { db } from "../db/index.js";
import {
  inquiryTable,
  activityLogTable,
  leadTable,
  proposalTable,
  serviceTable,
} from "../db/schema.js";
import { eq, desc, and, or, like, inArray, count, sql } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";
import counterService from "./counterService.js";

/**
 * InquiryService - Business logic layer for inquiry operations
 * Follows: Route → Controller → Service → DB architecture
 */
class InquiryService {
  // Map service names from database to frontend format (snake_case)
  serviceNameToFrontend(serviceName) {
    const reverseMapping = {
      "Fixed Monthly Rate": "fixed_monthly_rate",
      "Hazardous Waste": "hazardous_waste",
      "Clearing Project": "clearing_project",
      "Long Term Garbage": "long_term_garbage",
      "One-time Hauling": "onetime_hauling",
      "Purchase of Recyclables": "purchase_of_recyclables",
    };
    return reverseMapping[serviceName] || serviceName;
  }
  /**
   * Create a new inquiry
   * @param {Object} inquiryData - Inquiry data from request
   * @param {Object} options - Optional parameters (userId, source, etc.)
   * @returns {Promise<Object>} Created inquiry
   */
  async createInquiry(inquiryData, options = {}) {
    const { name, email, phone, company, message, serviceType } = inquiryData;
    const { source = "website" } = options;

    // Generate inquiry number (format: INQ-YYYYMMDD-NNNN)
    const inquiryNumber = await counterService.getNextInquiryNumber();

    const [inquiry] = await db
      .insert(inquiryTable)
      .values({
        inquiryNumber,
        name,
        email,
        phone,
        company,
        message,
        serviceType,
        source,
      })
      .returning();

    return inquiry;
  }

  /**
   * Get all inquiries with optional filtering, search, and pagination
   * @param {Object} options - Query options { status, assignedTo, search, source, page, limit }
   * @returns {Promise<Object>} Object with data and pagination info
   */
  async getAllInquiries(options = {}) {
    const {
      status,
      assignedTo,
      search,
      source,
      serviceType,
      month,
      page: rawPage = 1,
      limit: rawLimit = 10,
    } = options;

    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;
    const offset = (page - 1) * limit;

    // --- Build filter conditions ---
    const conditions = [];

    // Base condition: user scope (used for both filters AND facet counts)
    const baseConditions = [];
    if (assignedTo) {
      baseConditions.push(eq(inquiryTable.assignedTo, assignedTo));
    }

    // Status filter
    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      conditions.push(
        statuses.length === 1
          ? eq(inquiryTable.status, statuses[0])
          : inArray(inquiryTable.status, statuses),
      );
    }

    // Source filter
    if (source) {
      const sources = source.split(",").map((s) => s.trim());
      conditions.push(
        sources.length === 1
          ? eq(inquiryTable.source, sources[0])
          : inArray(inquiryTable.source, sources),
      );
    }

    // Service filter — resolve IDs synchronously from name mapping
    let serviceIdCondition = null;
    if (serviceType) {
      const serviceNameMapping = {
        fixed_monthly_rate: "Fixed Monthly Rate",
        hazardous_waste: "Hazardous Waste",
        clearing_project: "Clearing Project",
        long_term_garbage: "Long Term Garbage",
        onetime_hauling: "One-time Hauling",
        purchase_of_recyclables: "Purchase of Recyclables",
      };
      const actualNames = serviceType
        .split(",")
        .map((s) => serviceNameMapping[s.trim()] || s.trim());

      const services = await db
        .select({ id: serviceTable.id })
        .from(serviceTable)
        .where(inArray(serviceTable.name, actualNames));

      const serviceIds = services.map((s) => s.id);
      if (serviceIds.length > 0) {
        serviceIdCondition =
          serviceIds.length === 1
            ? eq(inquiryTable.serviceId, serviceIds[0])
            : inArray(inquiryTable.serviceId, serviceIds);
        conditions.push(serviceIdCondition);
      }
    }

    // Search filter
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(inquiryTable.name, term),
          like(inquiryTable.email, term),
          like(inquiryTable.company, term),
        ),
      );
    }

    // Month filter
    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      conditions.push(
        and(
          sql`${inquiryTable.createdAt} >= ${startDate}`,
          sql`${inquiryTable.createdAt} <= ${endDate}`,
        ),
      );
    }

    // Full WHERE for the filtered queries (base + specific filters)
    const allConditions = [...baseConditions, ...conditions];
    const whereClause =
      allConditions.length > 0 ? and(...allConditions) : undefined;

    // --- Run data+count and facets in parallel (2 queries instead of 5) ---
    const baseFilterSql = assignedTo
      ? sql`assigned_to = ${assignedTo}`
      : sql`1=1`;

    const [inquiriesWithCount, facetRows] = await Promise.all([
      // 1. Paginated data + total count via window function (replaces 2 queries)
      db
        .select({
          id: inquiryTable.id,
          inquiryNumber: inquiryTable.inquiryNumber,
          name: inquiryTable.name,
          email: inquiryTable.email,
          phone: inquiryTable.phone,
          company: inquiryTable.company,
          location: inquiryTable.location,
          message: inquiryTable.message,
          serviceId: inquiryTable.serviceId,
          serviceType: serviceTable.name,
          status: inquiryTable.status,
          source: inquiryTable.source,
          assignedTo: inquiryTable.assignedTo,
          notes: inquiryTable.notes,
          isInformationComplete: inquiryTable.isInformationComplete,
          createdAt: inquiryTable.createdAt,
          updatedAt: inquiryTable.updatedAt,
          service: {
            id: serviceTable.id,
            name: serviceTable.name,
            description: serviceTable.description,
          },
          totalCount: sql`(count(*) over())::int`,
        })
        .from(inquiryTable)
        .leftJoin(serviceTable, eq(inquiryTable.serviceId, serviceTable.id))
        .where(whereClause)
        .orderBy(desc(inquiryTable.createdAt))
        .limit(limit)
        .offset(offset),

      // 2. All 3 facets in one query via UNION ALL (replaces 3 queries)
      db.execute(sql`
        SELECT 'status'::text AS facet_type, status::text AS facet_value, count(*)::int AS cnt
          FROM inquiry WHERE ${baseFilterSql} GROUP BY status
        UNION ALL
        SELECT 'source'::text, source::text, count(*)::int
          FROM inquiry WHERE ${baseFilterSql} GROUP BY source
        UNION ALL
        SELECT 'service_type'::text, s.name::text, count(*)::int
          FROM inquiry i INNER JOIN service s ON i.service_id = s.id
          WHERE ${assignedTo ? sql`i.assigned_to = ${assignedTo}` : sql`1=1`}
          GROUP BY s.name
      `),
    ]);

    const total = inquiriesWithCount[0]?.totalCount ?? 0;
    const inquiries = inquiriesWithCount;

    // --- Fetch proposal statuses for the current page ---
    const inquiryIds = inquiries.map((inq) => inq.id);
    let proposalMap = {};

    if (inquiryIds.length > 0) {
      const proposalStatuses = await db
        .select({
          inquiryId: proposalTable.inquiryId,
          proposalId: proposalTable.id,
          proposalNumber: proposalTable.proposalNumber,
          status: proposalTable.status,
          createdAt: proposalTable.createdAt,
          rejectionReason: proposalTable.rejectionReason,
        })
        .from(proposalTable)
        .where(inArray(proposalTable.inquiryId, inquiryIds))
        .orderBy(desc(proposalTable.createdAt));

      for (const p of proposalStatuses) {
        if (!proposalMap[p.inquiryId]) {
          proposalMap[p.inquiryId] = {
            proposalId: p.proposalId,
            proposalNumber: p.proposalNumber,
            proposalStatus: p.status,
            proposalCreatedAt: p.createdAt,
            proposalRejectionReason: p.rejectionReason,
          };
        }
      }
    }

    // --- Build response ---
    const data = inquiries.map(({ totalCount, ...inquiry }) => ({
      ...inquiry,
      serviceType: inquiry.serviceType
        ? this.serviceNameToFrontend(inquiry.serviceType)
        : null,
      proposalId: proposalMap[inquiry.id]?.proposalId || null,
      proposalNumber: proposalMap[inquiry.id]?.proposalNumber || null,
      proposalStatus: proposalMap[inquiry.id]?.proposalStatus || null,
      proposalCreatedAt: proposalMap[inquiry.id]?.proposalCreatedAt || null,
      proposalRejectionReason:
        proposalMap[inquiry.id]?.proposalRejectionReason || null,
    }));

    // Parse combined UNION ALL facet rows into maps
    const facets = { status: {}, source: {}, serviceType: {} };
    for (const row of facetRows) {
      if (!row.facet_value) continue;
      switch (row.facet_type) {
        case "status":
          facets.status[row.facet_value] = row.cnt;
          break;
        case "source":
          facets.source[row.facet_value] = row.cnt;
          break;
        case "service_type":
          facets.serviceType[this.serviceNameToFrontend(row.facet_value)] =
            row.cnt;
          break;
      }
    }

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      facets,
    };
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

    // Get most recent proposal for this inquiry
    const [proposal] = await db
      .select({
        proposalId: proposalTable.id,
        status: proposalTable.status,
        createdAt: proposalTable.createdAt,
        rejectionReason: proposalTable.rejectionReason,
      })
      .from(proposalTable)
      .where(eq(proposalTable.inquiryId, inquiryId))
      .orderBy(desc(proposalTable.createdAt))
      .limit(1);

    return {
      ...inquiry,
      proposalId: proposal?.proposalId || null,
      proposalStatus: proposal?.status || null,
      proposalCreatedAt: proposal?.createdAt || null,
      proposalRejectionReason: proposal?.rejectionReason || null,
    };
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
    const {
      name,
      email,
      phone,
      company,
      location,
      message,
      source,
      status,
      assignedTo,
      notes,
      serviceType,
      serviceId,
      isInformationComplete,
    } = updateData;

    // Fetch only the fields needed for change tracking (skip proposal lookup)
    const [oldInquiry] = await db
      .select({
        name: inquiryTable.name,
        email: inquiryTable.email,
        phone: inquiryTable.phone,
        company: inquiryTable.company,
        location: inquiryTable.location,
        source: inquiryTable.source,
        status: inquiryTable.status,
        assignedTo: inquiryTable.assignedTo,
        serviceId: inquiryTable.serviceId,
        isInformationComplete: inquiryTable.isInformationComplete,
      })
      .from(inquiryTable)
      .where(eq(inquiryTable.id, inquiryId))
      .limit(1);

    if (!oldInquiry) {
      throw new AppError("Inquiry not found", 404);
    }

    // Convert empty strings to null for UUID fields
    const normalizedAssignedTo = assignedTo === "" ? null : assignedTo;
    const normalizedServiceId = serviceId === "" ? null : serviceId;

    const [inquiry] = await db
      .update(inquiryTable)
      .set({
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(location !== undefined && { location }),
        ...(message && { message }),
        ...(source && { source }),
        ...(status && { status }),
        ...(normalizedAssignedTo !== undefined && {
          assignedTo: normalizedAssignedTo,
        }),
        ...(notes !== undefined && { notes }),
        ...(serviceType !== undefined && { serviceType }),
        ...(normalizedServiceId !== undefined && {
          serviceId: normalizedServiceId,
        }),
        ...(isInformationComplete !== undefined && { isInformationComplete }),
        updatedAt: new Date(),
      })
      .where(eq(inquiryTable.id, inquiryId))
      .returning();

    if (!inquiry) {
      throw new AppError("Inquiry not found", 404);
    }

    // Track specific field changes
    const changes = {};

    if (name && name !== oldInquiry.name) {
      changes.name = { from: oldInquiry.name, to: name };
    }
    if (email && email !== oldInquiry.email) {
      changes.email = { from: oldInquiry.email, to: email };
    }
    if (phone !== undefined && phone !== oldInquiry.phone) {
      changes.phone = { from: oldInquiry.phone, to: phone };
    }
    if (company !== undefined && company !== oldInquiry.company) {
      changes.company = { from: oldInquiry.company, to: company };
    }
    if (location !== undefined && location !== oldInquiry.location) {
      changes.location = { from: oldInquiry.location, to: location };
    }
    if (source && source !== oldInquiry.source) {
      changes.source = { from: oldInquiry.source, to: source };
    }
    if (status && status !== oldInquiry.status) {
      changes.status = { from: oldInquiry.status, to: status };
    }
    if (
      normalizedAssignedTo !== undefined &&
      normalizedAssignedTo !== oldInquiry.assignedTo
    ) {
      changes.assignedTo = {
        from: oldInquiry.assignedTo,
        to: normalizedAssignedTo,
      };
    }
    if (
      normalizedServiceId !== undefined &&
      normalizedServiceId !== oldInquiry.serviceId
    ) {
      changes.serviceId = {
        from: oldInquiry.serviceId,
        to: normalizedServiceId,
      };
    }
    if (
      isInformationComplete !== undefined &&
      isInformationComplete !== oldInquiry.isInformationComplete
    ) {
      changes.isInformationComplete = {
        from: oldInquiry.isInformationComplete,
        to: isInformationComplete,
      };
    }

    if (Object.keys(changes).length > 0) {
      this._logInBackground({
        userId,
        action: "inquiry_updated",
        entityType: "inquiry",
        entityId: inquiry.id,
        details: { changes },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });
    }

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

    this._logInBackground({
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
    const {
      name,
      email,
      phone,
      company,
      message,
      source = "phone",
      serviceType,
    } = inquiryData;

    // Generate inquiry number (format: INQ-YYYYMMDD-NNNN)
    const inquiryNumber = await counterService.getNextInquiryNumber();

    const [inquiry] = await db
      .insert(inquiryTable)
      .values({
        inquiryNumber,
        name,
        email,
        phone,
        company,
        message,
        source,
        serviceType,
        assignedTo: userId,
        isInformationComplete: false,
      })
      .returning();

    this._logInBackground({
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
   * Assign inquiry to a user
   * @param {string} inquiryId - Inquiry UUID
   * @param {string} assignToUserId - User ID to assign to
   * @param {string} userId - User performing the assignment
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Updated inquiry
   * @throws {AppError} If inquiry not found
   */
  async assignInquiry(inquiryId, assignToUserId, userId, metadata = {}) {
    const [updatedInquiry] = await db
      .update(inquiryTable)
      .set({
        assignedTo: assignToUserId,
        updatedAt: new Date(),
      })
      .where(eq(inquiryTable.id, inquiryId))
      .returning();

    if (!updatedInquiry) {
      throw new AppError("Inquiry not found", 404);
    }

    this._logInBackground({
      userId,
      action: "inquiry_assigned",
      entityType: "inquiry",
      entityId: updatedInquiry.id,
      details: { assignedTo: assignToUserId },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedInquiry;
  }

  /**
   * Convert inquiry to lead with optional service details
   * @param {string} inquiryId - Inquiry UUID
   * @param {string} userId - User performing the conversion
   * @param {Object} serviceDetails - Optional service details from conversion form
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Created lead object
   * @throws {AppError} If inquiry not found
   */
  async convertInquiryToLead(inquiryId, userId, data = {}, metadata = {}) {
    // 1. Fetch inquiry
    const inquiry = await this.getInquiryById(inquiryId);

    // 2. Validate inquiry can be converted (warn if not qualified)
    if (inquiry.status !== "qualified") {
      console.warn(
        `Converting inquiry ${inquiryId} with status '${inquiry.status}' (recommended: 'qualified')`,
      );
    }

    // 3. Extract service requests array (new format)
    const { serviceRequests = [] } = data;

    // 4. Construct notes
    let leadNotes = `Converted from inquiry.\n\nOriginal message: ${inquiry.message}`;

    // 5. Create lead with mapped fields
    const [lead] = await db
      .insert(leadTable)
      .values({
        // From inquiry (required)
        companyName: inquiry.company || inquiry.name,
        contactPerson: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        assignedTo: inquiry.assignedTo || userId,

        // Set defaults (old fields will be removed later)
        wasteType: null,
        estimatedVolume: null,
        address: null,
        city: null,
        province: null,
        priority: 3,
        estimatedValue: null,

        // Constructed
        notes: leadNotes,
        status: "new",
      })
      .returning();

    // 6. Create service requests if provided
    if (serviceRequests && serviceRequests.length > 0) {
      const serviceRequestService = (await import("./serviceRequestService.js"))
        .default;

      for (const serviceRequest of serviceRequests) {
        await serviceRequestService.createServiceRequest({
          ...serviceRequest,
          leadId: lead.id,
        });
      }
    }

    // 7. Update inquiry status to converted
    await db
      .update(inquiryTable)
      .set({ status: "converted", updatedAt: new Date() })
      .where(eq(inquiryTable.id, inquiryId));

    // Fire-and-forget: batch both activity logs in a single INSERT
    db.insert(activityLogTable)
      .values([
        {
          userId,
          action: "inquiry_converted_to_lead",
          entityType: "inquiry",
          entityId: inquiry.id,
          details: JSON.stringify({
            leadId: lead.id,
            serviceRequestsCount: serviceRequests.length,
          }),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
        {
          userId,
          action: "lead_created_from_inquiry",
          entityType: "lead",
          entityId: lead.id,
          details: JSON.stringify({
            inquiryId: inquiry.id,
            serviceRequestsCount: serviceRequests.length,
          }),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      ])
      .catch((err) =>
        console.error("[InquiryService] Background convert log failed:", err.message)
      );

    return lead;
  }

  /**
   * Fire-and-forget activity log — does not block the caller.
   * @param {Object} activityData - Activity log data
   */
  _logInBackground(activityData) {
    this.logActivity(activityData).catch((err) =>
      console.error("[InquiryService] Background activity log failed:", err.message)
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

export default new InquiryService();
