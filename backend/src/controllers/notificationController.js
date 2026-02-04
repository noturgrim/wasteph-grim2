import notificationService from "../services/notificationService.js";

/**
 * Controller: Get user notifications
 * Route: GET /api/notifications
 * Access: Protected (authenticated users)
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getUserNotifications(req.user.id, {
      page,
      limit,
      unreadOnly: unreadOnly === "true",
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
 * Controller: Get unread notification count
 * Route: GET /api/notifications/unread-count
 * Access: Protected (authenticated users)
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mark notification as read
 * Route: PATCH /api/notifications/:id/read
 * Access: Protected (authenticated users)
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, req.user.id);

    res.json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mark all notifications as read
 * Route: PATCH /api/notifications/mark-all-read
 * Access: Protected (authenticated users)
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      count,
    });
  } catch (error) {
    next(error);
  }
};
