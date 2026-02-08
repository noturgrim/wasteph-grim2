import { db } from "../db/index.js";
import {
  leadTable,
  proposalTable,
  contractsTable,
  clientTable,
  calendarEventTable,
  activityLogTable,
} from "../db/schema.js";
import { eq, and, sql, gte, inArray, notInArray, desc } from "drizzle-orm";

class DashboardService {
  /**
   * Get sales dashboard data for a specific user.
   * Runs all queries in parallel for performance.
   */
  async getSalesDashboard(userId) {
    const now = new Date();

    const [
      leadStats,
      proposalStats,
      contractStats,
      clientCount,
      upcomingEvents,
      recentActivity,
    ] = await Promise.all([
      // 1. Lead counts — claimed by this user
      this._getLeadStats(userId),

      // 2. Proposal counts by status — requested by this user
      this._getProposalStats(userId),

      // 3. Contract counts by status — requested by this user
      this._getContractStats(userId),

      // 4. Client count — managed by this user
      this._getClientCount(userId),

      // 5. Upcoming calendar events — next 5
      this._getUpcomingEvents(userId, now),

      // 6. Recent activity — last 5
      this._getRecentActivity(userId),
    ]);

    return {
      stats: {
        activeLeads: leadStats.total,
        activeProposals: proposalStats.total,
        contractsInProgress: contractStats.total,
        myClients: clientCount,
      },
      pipeline: {
        leads: leadStats.breakdown,
        proposals: proposalStats.breakdown,
        contracts: contractStats.breakdown,
      },
      upcomingEvents,
      recentActivity,
    };
  }

  /**
   * Leads claimed by this user (not unclaimed leads).
   * Lead table has no status column — uses isClaimed boolean.
   */
  async _getLeadStats(userId) {
    const rows = await db
      .select({
        total: sql`count(*)::int`,
      })
      .from(leadTable)
      .where(eq(leadTable.claimedBy, userId));

    const total = rows[0]?.total ?? 0;

    return { total, breakdown: [] };
  }

  /**
   * Proposal counts grouped by status for the user.
   * Only counts active statuses for the top-level number.
   */
  async _getProposalStats(userId) {
    const activeStatuses = ["pending", "approved", "sent"];
    const displayStatuses = ["pending", "approved", "sent", "accepted"];

    const [activeRows, breakdownRows] = await Promise.all([
      db
        .select({ total: sql`count(*)::int` })
        .from(proposalTable)
        .where(
          and(
            eq(proposalTable.requestedBy, userId),
            inArray(proposalTable.status, activeStatuses),
          ),
        ),
      db
        .select({
          status: proposalTable.status,
          count: sql`count(*)::int`,
        })
        .from(proposalTable)
        .where(
          and(
            eq(proposalTable.requestedBy, userId),
            inArray(proposalTable.status, displayStatuses),
          ),
        )
        .groupBy(proposalTable.status),
    ]);

    const total = activeRows[0]?.total ?? 0;

    // Build ordered breakdown
    const countMap = Object.fromEntries(
      breakdownRows.map((r) => [r.status, r.count]),
    );
    const breakdown = displayStatuses.map((s) => ({
      status: s,
      count: countMap[s] ?? 0,
    }));

    return { total, breakdown };
  }

  /**
   * Contract counts grouped by status for the user.
   * "In progress" = everything except signed & hardbound_received.
   */
  async _getContractStats(userId) {
    const terminalStatuses = ["signed", "hardbound_received"];
    const displayStatuses = [
      "pending_request",
      "requested",
      "ready_for_sales",
      "sent_to_sales",
      "sent_to_client",
    ];

    const [activeRows, breakdownRows] = await Promise.all([
      db
        .select({ total: sql`count(*)::int` })
        .from(contractsTable)
        .where(
          and(
            eq(contractsTable.requestedBy, userId),
            notInArray(contractsTable.status, terminalStatuses),
          ),
        ),
      db
        .select({
          status: contractsTable.status,
          count: sql`count(*)::int`,
        })
        .from(contractsTable)
        .where(
          and(
            eq(contractsTable.requestedBy, userId),
            inArray(contractsTable.status, displayStatuses),
          ),
        )
        .groupBy(contractsTable.status),
    ]);

    const total = activeRows[0]?.total ?? 0;

    const countMap = Object.fromEntries(
      breakdownRows.map((r) => [r.status, r.count]),
    );
    const breakdown = displayStatuses.map((s) => ({
      status: s,
      count: countMap[s] ?? 0,
    }));

    return { total, breakdown };
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
   * Last 5 activity log entries for this user.
   */
  async _getRecentActivity(userId) {
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
      .where(eq(activityLogTable.userId, userId))
      .orderBy(desc(activityLogTable.createdAt))
      .limit(5);

    return rows;
  }
}

export default new DashboardService();
