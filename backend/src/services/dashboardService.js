import { db } from "../db/index.js";
import {
  leadTable,
  proposalTable,
  contractsTable,
  clientTable,
  calendarEventTable,
  activityLogTable,
  inquiryTable,
  clientTicketsTable,
} from "../db/schema.js";
import { eq, and, or, sql, gte, inArray, notInArray, desc } from "drizzle-orm";

class DashboardService {
  /**
   * Get sales dashboard data for a specific user.
   * Runs all queries in parallel for performance.
   */
  async getSalesDashboard(userId) {
    const now = new Date();

    const [
      activeLeads,
      activeProposals,
      contractsInProgress,
      myClients,
      upcomingEvents,
      recentActivity,
    ] = await Promise.all([
      // 1. Lead count — claimed by this user
      this._getLeadCount(userId),

      // 2. Active proposal count — requested by this user
      this._getActiveProposalCount(userId),

      // 3. In-progress contract count — requested by this user
      this._getContractInProgressCount(userId),

      // 4. Client count — managed by this user
      this._getClientCount(userId),

      // 5. Upcoming calendar events — next 5
      this._getUpcomingEvents(userId, now),

      // 6. Recent activity — last 10
      this._getRecentActivity(userId),
    ]);

    return {
      stats: {
        activeLeads,
        activeProposals,
        contractsInProgress,
        myClients,
      },
      upcomingEvents,
      recentActivity,
    };
  }

  /**
   * Count of leads claimed by this user.
   */
  async _getLeadCount(userId) {
    const rows = await db
      .select({ total: sql`count(*)::int` })
      .from(leadTable)
      .where(eq(leadTable.claimedBy, userId));

    return rows[0]?.total ?? 0;
  }

  /**
   * Count of active proposals (pending, approved, sent) requested by this user.
   */
  async _getActiveProposalCount(userId) {
    const rows = await db
      .select({ total: sql`count(*)::int` })
      .from(proposalTable)
      .where(
        and(
          eq(proposalTable.requestedBy, userId),
          inArray(proposalTable.status, ["pending", "approved", "sent"]),
        ),
      );

    return rows[0]?.total ?? 0;
  }

  /**
   * Count of in-progress contracts (everything except signed & hardbound_received).
   */
  async _getContractInProgressCount(userId) {
    const rows = await db
      .select({ total: sql`count(*)::int` })
      .from(contractsTable)
      .where(
        and(
          eq(contractsTable.requestedBy, userId),
          notInArray(contractsTable.status, ["signed", "hardbound_received"]),
        ),
      );

    return rows[0]?.total ?? 0;
  }

  /**
   * Count of clients where accountManager = userId.
   */
  async _getClientCount(userId) {
    const rows = await db
      .select({ total: sql`count(*)::int` })
      .from(clientTable)
      .where(eq(clientTable.accountManager, userId));

    return rows[0]?.total ?? 0;
  }

  /**
   * Next 5 scheduled calendar events for this user.
   */
  async _getUpcomingEvents(userId, now) {
    const rows = await db
      .select({
        id: calendarEventTable.id,
        title: calendarEventTable.title,
        eventType: calendarEventTable.eventType,
        scheduledDate: calendarEventTable.scheduledDate,
        startTime: calendarEventTable.startTime,
        endTime: calendarEventTable.endTime,
        status: calendarEventTable.status,
      })
      .from(calendarEventTable)
      .where(
        and(
          eq(calendarEventTable.userId, userId),
          eq(calendarEventTable.status, "scheduled"),
          gte(calendarEventTable.scheduledDate, now),
        ),
      )
      .orderBy(calendarEventTable.scheduledDate)
      .limit(5);

    return rows;
  }

  /**
   * Last 10 activity log entries relevant to this user, enriched with
   * entity names (company, proposal number, contract number, etc.)
   * via parallel lookups per entity type.
   *
   * Includes:
   * - Actions the user performed themselves
   * - Actions by others on entities the user owns (their proposals,
   *   contracts, tickets, inquiries, etc.)
   */
  async _getRecentActivity(userId) {
    // First, gather IDs of entities the user owns (parallel)
    const [myProposalIds, myContractIds, myTicketIds, myInquiryIds] =
      await Promise.all([
        db
          .select({ id: proposalTable.id })
          .from(proposalTable)
          .where(eq(proposalTable.requestedBy, userId))
          .then((r) => r.map((row) => row.id)),
        db
          .select({ id: contractsTable.id })
          .from(contractsTable)
          .where(eq(contractsTable.requestedBy, userId))
          .then((r) => r.map((row) => row.id)),
        db
          .select({ id: clientTicketsTable.id })
          .from(clientTicketsTable)
          .where(eq(clientTicketsTable.createdBy, userId))
          .then((r) => r.map((row) => row.id)),
        db
          .select({ id: inquiryTable.id })
          .from(inquiryTable)
          .where(eq(inquiryTable.assignedTo, userId))
          .then((r) => r.map((row) => row.id)),
      ]);

    // Build OR conditions: user's own actions + actions on their entities
    const conditions = [eq(activityLogTable.userId, userId)];

    if (myProposalIds.length > 0) {
      conditions.push(
        and(
          eq(activityLogTable.entityType, "proposal"),
          inArray(activityLogTable.entityId, myProposalIds),
        ),
      );
    }
    if (myContractIds.length > 0) {
      conditions.push(
        and(
          eq(activityLogTable.entityType, "contract"),
          inArray(activityLogTable.entityId, myContractIds),
        ),
      );
    }
    if (myTicketIds.length > 0) {
      conditions.push(
        and(
          eq(activityLogTable.entityType, "ticket"),
          inArray(activityLogTable.entityId, myTicketIds),
        ),
      );
    }
    if (myInquiryIds.length > 0) {
      conditions.push(
        and(
          eq(activityLogTable.entityType, "inquiry"),
          inArray(activityLogTable.entityId, myInquiryIds),
        ),
      );
    }

    const rows = await db
      .select({
        id: activityLogTable.id,
        action: activityLogTable.action,
        entityType: activityLogTable.entityType,
        entityId: activityLogTable.entityId,
        details: activityLogTable.details,
        createdAt: activityLogTable.createdAt,
      })
      .from(activityLogTable)
      .where(or(...conditions))
      .orderBy(desc(activityLogTable.createdAt))
      .limit(10);

    if (rows.length === 0) return rows;

    // Group entity IDs by type for batch lookups
    const idsByType = {};
    for (const row of rows) {
      if (!row.entityId) continue;
      if (!idsByType[row.entityType]) idsByType[row.entityType] = new Set();
      idsByType[row.entityType].add(row.entityId);
    }

    // Parallel batch lookups for each entity type
    const lookups = {};
    const promises = [];

    if (idsByType.proposal?.size) {
      promises.push(
        db
          .select({
            id: proposalTable.id,
            proposalNumber: proposalTable.proposalNumber,
            inquiryId: proposalTable.inquiryId,
          })
          .from(proposalTable)
          .where(inArray(proposalTable.id, [...idsByType.proposal]))
          .then((r) => { lookups.proposal = new Map(r.map((p) => [p.id, p])); }),
      );
    }

    if (idsByType.contract?.size) {
      promises.push(
        db
          .select({
            id: contractsTable.id,
            contractNumber: contractsTable.contractNumber,
            clientName: contractsTable.clientName,
            companyName: contractsTable.companyName,
            status: contractsTable.status,
          })
          .from(contractsTable)
          .where(inArray(contractsTable.id, [...idsByType.contract]))
          .then((r) => { lookups.contract = new Map(r.map((c) => [c.id, c])); }),
      );
    }

    if (idsByType.inquiry?.size) {
      promises.push(
        db
          .select({
            id: inquiryTable.id,
            inquiryNumber: inquiryTable.inquiryNumber,
            name: inquiryTable.name,
            company: inquiryTable.company,
          })
          .from(inquiryTable)
          .where(inArray(inquiryTable.id, [...idsByType.inquiry]))
          .then((r) => { lookups.inquiry = new Map(r.map((i) => [i.id, i])); }),
      );
    }

    if (idsByType.lead?.size) {
      promises.push(
        db
          .select({
            id: leadTable.id,
            clientName: leadTable.clientName,
            company: leadTable.company,
          })
          .from(leadTable)
          .where(inArray(leadTable.id, [...idsByType.lead]))
          .then((r) => { lookups.lead = new Map(r.map((l) => [l.id, l])); }),
      );
    }

    if (idsByType.client?.size) {
      promises.push(
        db
          .select({
            id: clientTable.id,
            companyName: clientTable.companyName,
            contactPerson: clientTable.contactPerson,
          })
          .from(clientTable)
          .where(inArray(clientTable.id, [...idsByType.client]))
          .then((r) => { lookups.client = new Map(r.map((c) => [c.id, c])); }),
      );
    }

    if (idsByType.ticket?.size) {
      promises.push(
        db
          .select({
            id: clientTicketsTable.id,
            ticketNumber: clientTicketsTable.ticketNumber,
            subject: clientTicketsTable.subject,
          })
          .from(clientTicketsTable)
          .where(inArray(clientTicketsTable.id, [...idsByType.ticket]))
          .then((r) => { lookups.ticket = new Map(r.map((t) => [t.id, t])); }),
      );
    }

    // Also look up inquiry names for proposals (to show who the proposal is for)
    await Promise.all(promises);

    // If we have proposals, also resolve their inquiry names
    const proposalInquiryIds = new Set();
    if (lookups.proposal) {
      for (const p of lookups.proposal.values()) {
        if (p.inquiryId) proposalInquiryIds.add(p.inquiryId);
      }
    }
    let inquiryNameMap = new Map();
    if (proposalInquiryIds.size > 0) {
      // Some inquiry IDs may already be in lookups.inquiry
      const missingIds = [...proposalInquiryIds].filter(
        (id) => !lookups.inquiry?.has(id),
      );
      if (missingIds.length > 0) {
        const extra = await db
          .select({
            id: inquiryTable.id,
            name: inquiryTable.name,
            company: inquiryTable.company,
          })
          .from(inquiryTable)
          .where(inArray(inquiryTable.id, missingIds));
        for (const i of extra) {
          if (!lookups.inquiry) lookups.inquiry = new Map();
          lookups.inquiry.set(i.id, i);
        }
      }
    }

    // Enrich each activity row with entity context + parsed details
    return rows.map((row) => {
      const entity = lookups[row.entityType]?.get(row.entityId);
      const context = {};

      // --- Entity-level info (from joined tables) ---
      if (row.entityType === "proposal" && entity) {
        context.proposalNumber = entity.proposalNumber;
        const inq = lookups.inquiry?.get(entity.inquiryId);
        if (inq) {
          context.clientName = inq.name;
          context.company = inq.company;
        }
      } else if (row.entityType === "contract" && entity) {
        context.contractNumber = entity.contractNumber;
        context.clientName = entity.clientName;
        context.company = entity.companyName;
      } else if (row.entityType === "inquiry" && entity) {
        context.inquiryNumber = entity.inquiryNumber;
        context.clientName = entity.name;
        context.company = entity.company;
      } else if (row.entityType === "lead" && entity) {
        context.clientName = entity.clientName;
        context.company = entity.company;
      } else if (row.entityType === "client" && entity) {
        context.company = entity.companyName;
        context.clientName = entity.contactPerson;
      } else if (row.entityType === "ticket" && entity) {
        context.ticketNumber = entity.ticketNumber;
        context.subject = entity.subject;
      }

      // --- Details-level info (from stored JSON in activity log) ---
      if (row.details) {
        try {
          const d = typeof row.details === "string"
            ? JSON.parse(row.details)
            : row.details;
          if (d && typeof d === "object") {
            if (d.oldStatus) context.oldStatus = d.oldStatus;
            if (d.newStatus) context.newStatus = d.newStatus;
            if (d.rejectionReason) context.rejectionReason = d.rejectionReason;
            if (d.clientEmail) context.clientEmail = d.clientEmail;
            if (d.contractType) context.contractType = d.contractType;
            if (d.requestNotes) context.requestNotes = d.requestNotes;
            if (d.ticketNumber && !context.ticketNumber) context.ticketNumber = d.ticketNumber;
            if (d.clientName && !context.clientName) context.clientName = d.clientName;
            if (d.source) context.source = d.source;
          }
        } catch {
          // ignore unparseable details
        }
      }

      return {
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        createdAt: row.createdAt,
        context,
      };
    });
  }
}

export default new DashboardService();
