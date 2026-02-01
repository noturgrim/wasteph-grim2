import calendarEventService from "../services/calendarEventService.js";

/**
 * Route: POST /api/calendar-events
 * Create a new calendar event
 */
export const createEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventData = req.body;

    const event = await calendarEventService.createEvent(eventData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Route: GET /api/calendar-events
 * Get calendar events with filters
 * Master Sales can view all events with viewAll=true
 */
export const getEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isMasterSales = req.user.isMasterSales; // Use isMasterSales field from database
    const { startDate, endDate, status, inquiryId, viewAll, page, limit } =
      req.query;

    const result = await calendarEventService.getEvents({
      userId,
      viewAll: isMasterSales && viewAll === "true", // Only Master Sales can view all
      startDate,
      endDate,
      status,
      inquiryId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Route: GET /api/calendar-events/:id
 * Get event by ID
 */
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await calendarEventService.getEventById(id);

    // Check if user has access
    if (event.userId !== req.user.id && req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this event",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Route: PATCH /api/calendar-events/:id
 * Update event
 */
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const event = await calendarEventService.updateEvent(
      id,
      updateData,
      userId,
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    );

    res.json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Route: POST /api/calendar-events/:id/complete
 * Mark event as completed
 */
export const completeEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await calendarEventService.completeEvent(id, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Event marked as completed",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Route: DELETE /api/calendar-events/:id
 * Delete event
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await calendarEventService.deleteEvent(id, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
