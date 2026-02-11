import { db } from "../db/index.js";
import { notificationsTable, userTable } from "../db/schema.js";
import { eq, desc, and, count, sql } from "drizzle-orm";
import socketServer from "../socket/socketServer.js";

/**
 * NotificationService - Manages in-app notifications
 * Creates, retrieves, and marks notifications as read
 */
class NotificationService {
  /**
   * Create a notification for a user
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(notificationData) {
    const { userId, type, title, message, entityType, entityId, metadata } = notificationData;

    const [notification] = await db
      .insert(notificationsTable)
      .values({
        userId,
        type,
        title,
        message,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .returning();

    // Emit socket event to user in real-time
    if (socketServer.isUserConnected(userId)) {
      socketServer.emitToUser(userId, "notification:new", {
        ...notification,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      });
    }

    return notification;
  }

  /**
   * Create notifications for multiple users (bulk)
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} notificationData - Notification data (without userId)
   * @returns {Promise<Array>} Created notifications
   */
  async createBulkNotifications(userIds, notificationData) {
    const { type, title, message, entityType, entityId, metadata } = notificationData;

    const notifications = await db
      .insert(notificationsTable)
      .values(
        userIds.map((userId) => ({
          userId,
          type,
          title,
          message,
          entityType,
          entityId,
          metadata: metadata ? JSON.stringify(metadata) : null,
        }))
      )
      .returning();

    // Emit socket events to all users
    notifications.forEach((notification) => {
      if (socketServer.isUserConnected(notification.userId)) {
        socketServer.emitToUser(notification.userId, "notification:new", {
          ...notification,
          metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
        });
      }
    });

    return notifications;
  }

  /**
   * Get user notifications with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Notifications with pagination
   */
  async getUserNotifications(userId, options = {}) {
    const { page: rawPage = 1, limit: rawLimit = 20, unreadOnly = false } = options;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 20;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(notificationsTable.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notificationsTable.isRead, false));
    }

    const whereClause = and(...conditions);

    // Count total
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(notificationsTable)
      .where(whereClause);

    // Get notifications
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(whereClause)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse metadata JSON
    const parsedNotifications = notifications.map((notif) => ({
      ...notif,
      metadata: notif.metadata ? JSON.parse(notif.metadata) : null,
    }));

    return {
      data: parsedNotifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId) {
    const [{ value: unreadCount }] = await db
      .select({ value: count() })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, userId),
          eq(notificationsTable.isRead, false)
        )
      );

    return unreadCount;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for permission check)
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    const [notification] = await db
      .update(notificationsTable)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notificationsTable.id, notificationId),
          eq(notificationsTable.userId, userId)
        )
      )
      .returning();

    // Emit socket event
    if (notification && socketServer.isUserConnected(userId)) {
      socketServer.emitToUser(userId, "notification:read", {
        notificationId,
      });
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of notifications marked as read
   */
  async markAllAsRead(userId) {
    const result = await db
      .update(notificationsTable)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notificationsTable.userId, userId),
          eq(notificationsTable.isRead, false)
        )
      )
      .returning();

    // Emit socket event
    if (result.length > 0 && socketServer.isUserConnected(userId)) {
      socketServer.emitToUser(userId, "notification:allRead", {
        count: result.length,
      });
    }

    return result.length;
  }

  /**
   * Delete old read notifications (cleanup)
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<number>} Number of notifications deleted
   */
  async cleanupOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.setDate() - daysOld);

    const result = await db
      .delete(notificationsTable)
      .where(
        and(
          eq(notificationsTable.isRead, true),
          sql`${notificationsTable.createdAt} < ${cutoffDate}`
        )
      )
      .returning();

    return result.length;
  }
}

export default new NotificationService();
