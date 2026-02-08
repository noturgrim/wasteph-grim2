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
   * Last 10 activity log entries for this user.
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
      .limit(10);

    return rows;
  }
}

export default new DashboardService();
