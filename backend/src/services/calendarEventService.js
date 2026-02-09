import { db } from "../db/index.js";
import {
  calendarEventTable,
  activityLogTable,
  inquiryTable,
  clientTable,
  userTable,
} from "../db/schema.js";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";
import emailService from "./emailService.js";

class CalendarEventService {
  /**
   * Log activity (fire-and-forget — does not block the response)
   */
  _logInBackground(data) {
    db.insert(activityLogTable)
      .values({
        ...data,
        details: data.details ? JSON.stringify(data.details) : null,
      })
      .catch((error) => console.error("Failed to log activity:", error));
  }

  /**
   * Create a new calendar event
   */
  async createEvent(eventData, creatorUserId, metadata = {}) {
    const {
      title,
      description,
      eventType,
      scheduledDate,
      startTime,
      endTime,
      inquiryId,
      clientId,
      notes,
      userId: assignedUserId, // Optional: assign to specific user
    } = eventData;

    // Determine who the event is assigned to (default: creator)
    const eventUserId = assignedUserId || creatorUserId;

    const [event] = await db
      .insert(calendarEventTable)
      .values({
        userId: eventUserId,
        inquiryId: inquiryId || null,
        clientId: clientId || null,
        title,
        description: description || null,
        eventType: eventType || null,
        scheduledDate: new Date(scheduledDate),
        startTime: startTime || null,
        endTime: endTime || null,
        status: "scheduled",
        notes: notes || null,
      })
      .returning();

    // Log activity (fire-and-forget)
    this._logInBackground({
      userId: creatorUserId,
      inquiryId: event.inquiryId, // Link to inquiry for timeline (if applicable)
      action: "calendar_event_created",
      entityType: "calendar_event",
      entityId: event.id,
      details: {
        title: event.title,
        eventType: event.eventType,
        scheduledDate: event.scheduledDate,
        inquiryId: event.inquiryId,
        clientId: event.clientId,
        assignedTo: eventUserId,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    // Send "Event Assigned" notification if assigned to someone else
    if (assignedUserId && assignedUserId !== creatorUserId) {
      // Get assigned user info
      const [assignedUser] = await db
        .select({
          email: userTable.email,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
        })
        .from(userTable)
        .where(eq(userTable.id, assignedUserId));

      // Get creator info
      const [creator] = await db
        .select({
          firstName: userTable.firstName,
          lastName: userTable.lastName,
        })
        .from(userTable)
        .where(eq(userTable.id, creatorUserId));

      // Get client info if applicable
      let clientInfo = null;
      if (clientId) {
        const [client] = await db
          .select({
            contactPerson: clientTable.contactPerson,
            companyName: clientTable.companyName,
          })
          .from(clientTable)
          .where(eq(clientTable.id, clientId));
        clientInfo = client;
      }

      if (assignedUser && assignedUser.email && creator) {
        const emailData = {
          eventId: event.id,
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          scheduledDate: event.scheduledDate,
          startTime: event.startTime,
          endTime: event.endTime,
          creatorName: `${creator.firstName} ${creator.lastName}`,
          clientName: clientInfo?.contactPerson,
          companyName: clientInfo?.companyName,
        };

        // Send email (fire and forget)
        emailService
          .sendEventAssignedEmail(assignedUser.email, emailData)
          .catch((err) =>
            console.error(`Failed to send event assigned notification:`, err.message)
          );
      }
    }

    // Check if event is within 24-hour window and send immediate reminder
    const now = new Date();
    const eventTime = new Date(event.scheduledDate);
    const hoursUntilEvent = (eventTime - now) / (1000 * 60 * 60);

    // Send immediate 24h reminder if event is 23-25 hours away (catches same-day/next-day events)
    if (hoursUntilEvent >= 23 && hoursUntilEvent <= 25) {
      // Get user info for email
      const [eventUser] = await db
        .select({
          email: userTable.email,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
        })
        .from(userTable)
        .where(eq(userTable.id, eventUserId));

      // Get client info if applicable (reuse if already fetched)
      let clientInfo = null;
      if (clientId) {
        const [client] = await db
          .select({
            contactPerson: clientTable.contactPerson,
            companyName: clientTable.companyName,
          })
          .from(clientTable)
          .where(eq(clientTable.id, clientId));
        clientInfo = client;
      }

      if (eventUser && eventUser.email) {
        const emailData = {
          eventId: event.id,
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          scheduledDate: event.scheduledDate,
          startTime: event.startTime,
          endTime: event.endTime,
          userName: `${eventUser.firstName} ${eventUser.lastName}`,
          clientName: clientInfo?.contactPerson,
          companyName: clientInfo?.companyName,
          hoursUntil: Math.round(hoursUntilEvent),
        };

        // Send 24h reminder immediately (fire and forget)
        emailService
          .sendEventReminderEmail(eventUser.email, emailData, "24h")
          .catch((err) =>
            console.error(`Failed to send immediate 24h reminder for event ${event.id}:`, err.message)
          );

        // Mark as sent in database
        await db
          .update(calendarEventTable)
          .set({ reminder24hSentAt: now })
          .where(eq(calendarEventTable.id, event.id));

        console.log(`✅ Immediate 24h reminder sent for event ${event.id} (${hoursUntilEvent.toFixed(1)}h away)`);
      }
    }

    return event;
  }

  /**
   * Bulk-create monthly check-in events for a client contract
   * @param {Object} params - { clientId, contractId, contractNumber, companyName, startDate, endDate, userId }
   * @param {Object} metadata - { ipAddress, userAgent }
   * @returns {Promise<Array>} Created events
   */
  async bulkCreateMonthlyEvents(params, metadata = {}) {
    const {
      clientId,
      contractNumber,
      companyName,
      startDate,
      endDate,
      userId,
    } = params;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError("Invalid start or end date", 400);
    }
    if (start >= end) {
      throw new AppError("Start date must be before end date", 400);
    }

    // Generate monthly dates (same day each month from start to end)
    const dates = [];
    const current = new Date(start);
    const dayOfMonth = start.getDate();

    while (current <= end) {
      dates.push(new Date(current));
      // Move to next month, preserving the day
      const nextMonth = current.getMonth() + 1;
      current.setMonth(nextMonth);
      // Handle months with fewer days (e.g., Jan 31 -> Feb 28)
      if (current.getDate() !== dayOfMonth) {
        current.setDate(0); // Last day of previous month
      }
    }

    if (dates.length === 0) {
      throw new AppError("No dates generated for the given range", 400);
    }

    // Build values for bulk insert
    const title = `Monthly Check-in - ${contractNumber} (${companyName})`;
    const values = dates.map((date) => ({
      userId,
      clientId,
      title,
      description: `Scheduled monthly check-in for ${companyName}. Contract: ${contractNumber}`,
      eventType: "client_checkup",
      scheduledDate: date,
      startTime: "09:00",
      endTime: "10:00",
      status: "scheduled",
    }));

    const events = await db
      .insert(calendarEventTable)
      .values(values)
      .returning();

    // Log activity (fire-and-forget)
    this._logInBackground({
      userId,
      action: "calendar_bulk_schedule_created",
      entityType: "client",
      entityId: clientId,
      details: {
        contractNumber,
        companyName,
        eventsCreated: events.length,
        dateRange: { from: start.toISOString(), to: end.toISOString() },
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return events;
  }

  /**
   * Get events for a user with optional filters
   * If viewAll is true (Master Sales), return all users' events
   * OPTIMIZED: Reduced joins, smaller payload
   */
  async getEvents(options = {}) {
    const {
      userId,
      viewAll = false,
      startDate,
      endDate,
      status,
      inquiryId,
      clientId,
      eventType,
      page = 1,
      limit = 50,
    } = options;

    const conditions = [];

    // User filter - only apply if not viewing all events
    if (!viewAll) {
      if (userId) {
        conditions.push(eq(calendarEventTable.userId, userId));
      } else {
        throw new AppError("User ID is required", 400);
      }
    }

    // Date range filter
    if (startDate) {
      conditions.push(
        gte(calendarEventTable.scheduledDate, new Date(startDate))
      );
    }
    if (endDate) {
      conditions.push(lte(calendarEventTable.scheduledDate, new Date(endDate)));
    }

    // Status filter
    if (status) {
      conditions.push(eq(calendarEventTable.status, status));
    }

    // Inquiry filter
    if (inquiryId) {
      conditions.push(eq(calendarEventTable.inquiryId, inquiryId));
    }

    // Client filter
    if (clientId) {
      conditions.push(eq(calendarEventTable.clientId, clientId));
    }

    // Event type filter
    if (eventType) {
      conditions.push(eq(calendarEventTable.eventType, eventType));
    }

    // Single query: data + count via window function (1 round-trip instead of 2)
    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const results = await db
      .select({
        id: calendarEventTable.id,
        userId: calendarEventTable.userId,
        inquiryId: calendarEventTable.inquiryId,
        clientId: calendarEventTable.clientId,
        title: calendarEventTable.title,
        description: calendarEventTable.description,
        eventType: calendarEventTable.eventType,
        scheduledDate: calendarEventTable.scheduledDate,
        startTime: calendarEventTable.startTime,
        endTime: calendarEventTable.endTime,
        status: calendarEventTable.status,
        completedAt: calendarEventTable.completedAt,
        notes: calendarEventTable.notes,
        createdAt: calendarEventTable.createdAt,
        updatedAt: calendarEventTable.updatedAt,
        userFirstName: userTable.firstName,
        userLastName: userTable.lastName,
        totalCount: sql`(count(*) over())::int`,
      })
      .from(calendarEventTable)
      .leftJoin(userTable, eq(calendarEventTable.userId, userTable.id))
      .where(whereClause)
      .orderBy(calendarEventTable.scheduledDate)
      .limit(limit)
      .offset(offset);

    const total = results[0]?.totalCount ?? 0;

    // Transform: nest user data, strip totalCount
    const events = results.map(({ totalCount, ...event }) => ({
      id: event.id,
      userId: event.userId,
      inquiryId: event.inquiryId,
      clientId: event.clientId,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      scheduledDate: event.scheduledDate,
      startTime: event.startTime,
      endTime: event.endTime,
      status: event.status,
      completedAt: event.completedAt,
      notes: event.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      user: event.userFirstName
        ? {
            name: `${event.userFirstName} ${event.userLastName}`,
          }
        : null,
    }));

    return {
      data: events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get event by ID
   * OPTIMIZATION: Keep full joins for detail view (ViewEventDialog needs this data)
   */
  async getEventById(eventId) {
    const [result] = await db
      .select({
        id: calendarEventTable.id,
        userId: calendarEventTable.userId,
        inquiryId: calendarEventTable.inquiryId,
        clientId: calendarEventTable.clientId,
        title: calendarEventTable.title,
        description: calendarEventTable.description,
        eventType: calendarEventTable.eventType,
        scheduledDate: calendarEventTable.scheduledDate,
        startTime: calendarEventTable.startTime,
        endTime: calendarEventTable.endTime,
        status: calendarEventTable.status,
        completedAt: calendarEventTable.completedAt,
        notes: calendarEventTable.notes,
        createdAt: calendarEventTable.createdAt,
        updatedAt: calendarEventTable.updatedAt,
        // User info (for ownership)
        userFirstName: userTable.firstName,
        userLastName: userTable.lastName,
        userEmail: userTable.email,
        // Inquiry info (for detail view)
        inquiryName: inquiryTable.name,
        inquiryCompany: inquiryTable.company,
        inquiryStatus: inquiryTable.status,
        // Client info (for detail view)
        clientCompanyName: clientTable.companyName,
        clientContactPerson: clientTable.contactPerson,
        clientStatus: clientTable.status,
      })
      .from(calendarEventTable)
      .leftJoin(userTable, eq(calendarEventTable.userId, userTable.id))
      .leftJoin(inquiryTable, eq(calendarEventTable.inquiryId, inquiryTable.id))
      .leftJoin(clientTable, eq(calendarEventTable.clientId, clientTable.id))
      .where(eq(calendarEventTable.id, eventId))
      .limit(1);

    if (!result) {
      throw new AppError("Event not found", 404);
    }

    // Transform with flattened fields
    const event = {
      id: result.id,
      userId: result.userId,
      inquiryId: result.inquiryId,
      clientId: result.clientId,
      title: result.title,
      description: result.description,
      eventType: result.eventType,
      scheduledDate: result.scheduledDate,
      startTime: result.startTime,
      endTime: result.endTime,
      status: result.status,
      completedAt: result.completedAt,
      notes: result.notes,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      // Flattened fields for ViewEventDialog
      inquiryName: result.inquiryName,
      inquiryCompany: result.inquiryCompany,
      inquiryStatus: result.inquiryStatus,
      clientCompanyName: result.clientCompanyName,
      clientContactPerson: result.clientContactPerson,
      clientStatus: result.clientStatus,
      // User object
      user: result.userFirstName
        ? {
            id: result.userId,
            name: `${result.userFirstName} ${result.userLastName}`,
            email: result.userEmail,
          }
        : null,
    };

    return event;
  }

  /**
   * Update event
   */
  async updateEvent(eventId, updateData, userId, metadata = {}) {
    const {
      title,
      description,
      eventType,
      scheduledDate,
      startTime,
      endTime,
      status,
      notes,
      inquiryId,
    } = updateData;

    // Get old event for logging
    const oldEvent = await this.getEventById(eventId);

    // Check ownership
    if (oldEvent.userId !== userId) {
      throw new AppError("You can only update your own events", 403);
    }

    const [event] = await db
      .update(calendarEventTable)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(eventType !== undefined && { eventType }),
        ...(scheduledDate !== undefined && {
          scheduledDate: new Date(scheduledDate),
        }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(inquiryId !== undefined && { inquiryId }),
        ...(status === "completed" &&
          !oldEvent.completedAt && { completedAt: new Date() }),
        updatedAt: new Date(),
      })
      .where(eq(calendarEventTable.id, eventId))
      .returning();

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    // Log activity (fire-and-forget)
    this._logInBackground({
      userId,
      inquiryId: event.inquiryId, // Link to inquiry for timeline
      action: "calendar_event_updated",
      entityType: "calendar_event",
      entityId: event.id,
      details: {
        title: event.title,
        eventType: event.eventType,
        scheduledDate: event.scheduledDate,
        eventId: event.id, // Include eventId for navigation
        statusChanged:
          oldEvent.status !== event.status
            ? { from: oldEvent.status, to: event.status }
            : null,
        // Include notes/report if event was marked as completed
        notes: event.status === "completed" && event.notes ? event.notes : null,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return event;
  }

  /**
   * Delete event (soft delete - changes status to cancelled)
   * Combines ownership check + update in a single query
   */
  async deleteEvent(eventId, userId, metadata = {}) {
    const [cancelledEvent] = await db
      .update(calendarEventTable)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(calendarEventTable.id, eventId),
          eq(calendarEventTable.userId, userId),
        ),
      )
      .returning();

    if (!cancelledEvent) {
      // Could be not found or not owned — check which
      const [exists] = await db
        .select({ id: calendarEventTable.id })
        .from(calendarEventTable)
        .where(eq(calendarEventTable.id, eventId))
        .limit(1);

      throw new AppError(
        exists
          ? "You can only cancel your own events"
          : "Event not found",
        exists ? 403 : 404,
      );
    }

    // Log activity (fire-and-forget)
    this._logInBackground({
      userId,
      inquiryId: cancelledEvent.inquiryId,
      action: "calendar_event_deleted",
      entityType: "calendar_event",
      entityId: eventId,
      details: {
        title: cancelledEvent.title,
        eventType: cancelledEvent.eventType,
        scheduledDate: cancelledEvent.scheduledDate,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return cancelledEvent;
  }

  /**
   * Mark event as completed with optional notes/report
   */
  async completeEvent(eventId, userId, notes = null, metadata = {}) {
    const updateData = {
      status: "completed",
      completedAt: new Date(),
    };

    // Update notes if provided
    if (notes !== null && notes !== undefined) {
      updateData.notes = notes;
    }

    return this.updateEvent(eventId, updateData, userId, metadata);
  }
}

export default new CalendarEventService();
