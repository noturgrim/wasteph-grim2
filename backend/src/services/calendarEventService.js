import { db } from "../db/index.js";
import {
  calendarEventTable,
  activityLogTable,
  inquiryTable,
} from "../db/schema.js";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";

class CalendarEventService {
  /**
   * Log activity
   */
  async logActivity(data) {
    try {
      await db.insert(activityLogTable).values({
        ...data,
        details: data.details ? JSON.stringify(data.details) : null,
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(eventData, userId, metadata = {}) {
    const {
      title,
      description,
      eventType,
      scheduledDate,
      startTime,
      endTime,
      inquiryId,
      notes,
    } = eventData;

    const [event] = await db
      .insert(calendarEventTable)
      .values({
        userId,
        inquiryId: inquiryId || null,
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

    // Log activity
    await this.logActivity({
      userId,
      inquiryId: event.inquiryId, // Link to inquiry for timeline
      action: "calendar_event_created",
      entityType: "calendar_event",
      entityId: event.id,
      details: {
        title: event.title,
        eventType: event.eventType,
        scheduledDate: event.scheduledDate,
        inquiryId: event.inquiryId,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return event;
  }

  /**
   * Get events for a user with optional filters
   */
  async getEvents(options = {}) {
    const {
      userId,
      startDate,
      endDate,
      status,
      inquiryId,
      page = 1,
      limit = 50,
    } = options;

    const conditions = [];

    // User filter (required)
    if (userId) {
      conditions.push(eq(calendarEventTable.userId, userId));
    } else {
      throw new AppError("User ID is required", 400);
    }

    // Date range filter
    if (startDate) {
      conditions.push(
        gte(calendarEventTable.scheduledDate, new Date(startDate)),
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

    // Build query with joins
    let query = db
      .select({
        id: calendarEventTable.id,
        userId: calendarEventTable.userId,
        inquiryId: calendarEventTable.inquiryId,
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
        // Include inquiry info if linked
        inquiry: {
          id: inquiryTable.id,
          name: inquiryTable.name,
          company: inquiryTable.company,
          status: inquiryTable.status,
        },
      })
      .from(calendarEventTable)
      .leftJoin(
        inquiryTable,
        eq(calendarEventTable.inquiryId, inquiryTable.id),
      );

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Count total
    let countQuery = db.select({ value: count() }).from(calendarEventTable);

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ value: total }] = await countQuery;

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    const events = await query
      .orderBy(calendarEventTable.scheduledDate)
      .limit(limit)
      .offset(offset);

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
   */
  async getEventById(eventId) {
    const [event] = await db
      .select({
        id: calendarEventTable.id,
        userId: calendarEventTable.userId,
        inquiryId: calendarEventTable.inquiryId,
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
        inquiry: {
          id: inquiryTable.id,
          name: inquiryTable.name,
          company: inquiryTable.company,
          status: inquiryTable.status,
        },
      })
      .from(calendarEventTable)
      .leftJoin(inquiryTable, eq(calendarEventTable.inquiryId, inquiryTable.id))
      .where(eq(calendarEventTable.id, eventId))
      .limit(1);

    if (!event) {
      throw new AppError("Event not found", 404);
    }

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

    // Log activity
    await this.logActivity({
      userId,
      inquiryId: event.inquiryId, // Link to inquiry for timeline
      action: "calendar_event_updated",
      entityType: "calendar_event",
      entityId: event.id,
      details: {
        title: event.title,
        eventType: event.eventType,
        scheduledDate: event.scheduledDate,
        statusChanged:
          oldEvent.status !== event.status
            ? { from: oldEvent.status, to: event.status }
            : null,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return event;
  }

  /**
   * Delete event (soft delete - changes status to cancelled)
   */
  async deleteEvent(eventId, userId, metadata = {}) {
    // Get event for ownership check
    const event = await this.getEventById(eventId);

    // Check ownership
    if (event.userId !== userId) {
      throw new AppError("You can only delete your own events", 403);
    }

    // Soft delete by setting status to cancelled
    const [cancelledEvent] = await db
      .update(calendarEventTable)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(calendarEventTable.id, eventId))
      .returning();

    if (!cancelledEvent) {
      throw new AppError("Event not found", 404);
    }

    // Log activity
    await this.logActivity({
      userId,
      inquiryId: event.inquiryId, // Link to inquiry for timeline
      action: "calendar_event_deleted",
      entityType: "calendar_event",
      entityId: eventId,
      details: {
        title: event.title,
        eventType: event.eventType,
        scheduledDate: event.scheduledDate,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return cancelledEvent;
  }

  /**
   * Mark event as completed
   */
  async completeEvent(eventId, userId, metadata = {}) {
    return this.updateEvent(eventId, { status: "completed" }, userId, metadata);
  }
}

export default new CalendarEventService();
