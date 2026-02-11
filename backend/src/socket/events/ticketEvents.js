/**
 * Ticket Socket Events
 * Defines all real-time events for the ticket system
 */

export const TICKET_EVENTS = {
  // Ticket lifecycle events
  TICKET_CREATED: "ticket:created",
  TICKET_UPDATED: "ticket:updated",
  TICKET_STATUS_CHANGED: "ticket:statusChanged",
  TICKET_PRIORITY_CHANGED: "ticket:priorityChanged",
  TICKET_DELETED: "ticket:deleted",

  // Comment events
  COMMENT_ADDED: "ticket:commentAdded",
  COMMENT_UPDATED: "ticket:commentUpdated",
  COMMENT_DELETED: "ticket:commentDeleted",

  // Attachment events
  ATTACHMENT_ADDED: "ticket:attachmentAdded",
  ATTACHMENT_DELETED: "ticket:attachmentDeleted",

  // Assignment events
  TICKET_ASSIGNED: "ticket:assigned",
  TICKET_UNASSIGNED: "ticket:unassigned",

  // Subscription events
  SUBSCRIBE_TICKET: "ticket:subscribe",
  UNSUBSCRIBE_TICKET: "ticket:unsubscribe",
  SUBSCRIBE_ALL_TICKETS: "tickets:subscribeAll",
  UNSUBSCRIBE_ALL_TICKETS: "tickets:unsubscribeAll",

  // Typing indicators (optional for future)
  USER_TYPING: "ticket:userTyping",
  USER_STOPPED_TYPING: "ticket:userStoppedTyping",
};

/**
 * Ticket Event Emitter
 * Handles all ticket-related socket emissions with proper authorization
 */
class TicketEventEmitter {
  constructor(socketServer) {
    this.socketServer = socketServer;
    this.notificationService = null;
  }

  /**
   * Initialize notification service
   * @param {Object} notificationService - NotificationService instance
   */
  setNotificationService(notificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Get users who should receive ticket updates
   * @param {Object} ticket - Ticket data
   * @param {Object} options - Additional options
   * @returns {Array<string>} Array of user IDs
   */
  _getTicketRecipients(ticket, options = {}) {
    const recipients = new Set();

    // Always notify ticket creator
    if (ticket.createdBy) {
      recipients.add(ticket.createdBy);
    }

    // Notify assigned user if exists
    if (ticket.assignedTo) {
      recipients.add(ticket.assignedTo);
    }

    // Notify resolver if resolved
    if (ticket.resolvedBy) {
      recipients.add(ticket.resolvedBy);
    }

    // Exclude the user who triggered the event (they already know)
    if (options.excludeUserId) {
      recipients.delete(options.excludeUserId);
    }

    return Array.from(recipients);
  }

  /**
   * Emit ticket created event
   * @param {Object} ticket - Created ticket
   * @param {Object} user - User object who created the ticket
   */
  async emitTicketCreated(ticket, user) {
    // Get all admin user IDs
    const adminIds = await this._getUserIdsByRoles(["admin", "super_admin"]);
    
    // Remove the creator from receiving their own notification
    const recipients = adminIds.filter((id) => id !== user.id);
    
    // Notify admins (excluding the creator)
    this.socketServer.emitToUsers(
      recipients,
      TICKET_EVENTS.TICKET_CREATED,
      {
        ticket,
        createdBy: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profilePictureUrl: user.profilePictureUrl,
        },
      }
    );

    // Create notifications for admins (excluding the creator)
    if (this.notificationService) {
      const adminIds = await this._getUserIdsByRoles(["admin", "super_admin"]);
      const recipients = adminIds.filter((id) => id !== user.id);

      if (recipients.length > 0) {
        await this.notificationService.createBulkNotifications(recipients, {
          type: "ticket_created",
          title: "New Ticket Created",
          message: `${user.firstName} ${user.lastName} created ticket ${ticket.ticketNumber}`,
          entityType: "ticket",
          entityId: ticket.id,
          metadata: {
            ticketNumber: ticket.ticketNumber,
            priority: ticket.priority,
            category: ticket.category,
            creatorName: `${user.firstName} ${user.lastName}`,
            creatorProfilePicture: user.profilePictureUrl,
          },
        });
      }
    }

    console.log(`📨 Ticket created event emitted: ${ticket.ticketNumber}`);
  }

  /**
   * Emit ticket updated event
   * @param {Object} ticket - Updated ticket
   * @param {Object} changes - Changed fields
   * @param {string} updatedBy - User who updated the ticket
   */
  emitTicketUpdated(ticket, changes, updatedBy) {
    const recipients = this._getTicketRecipients(ticket, {
      excludeUserId: updatedBy,
    });

    this.socketServer.emitToUsers(recipients, TICKET_EVENTS.TICKET_UPDATED, {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      changes,
      updatedBy,
    });

    // Also notify admins
    this.socketServer.emitToRoles(
      ["admin", "super_admin"],
      TICKET_EVENTS.TICKET_UPDATED,
      {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        changes,
        updatedBy,
      }
    );

    console.log(`📨 Ticket updated event emitted: ${ticket.ticketNumber}`);
  }

  /**
   * Emit ticket status changed event
   * @param {Object} ticket - Ticket data
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @param {string} changedBy - User who changed the status
   */
  emitTicketStatusChanged(ticket, oldStatus, newStatus, changedBy) {
    const recipients = this._getTicketRecipients(ticket, {
      excludeUserId: changedBy,
    });

    this.socketServer.emitToUsers(
      recipients,
      TICKET_EVENTS.TICKET_STATUS_CHANGED,
      {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        oldStatus,
        newStatus,
        changedBy,
        ticket,
      }
    );

    // Notify admins
    this.socketServer.emitToRoles(
      ["admin", "super_admin"],
      TICKET_EVENTS.TICKET_STATUS_CHANGED,
      {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        oldStatus,
        newStatus,
        changedBy,
        ticket,
      }
    );

    console.log(
      `📨 Ticket status changed: ${ticket.ticketNumber} (${oldStatus} → ${newStatus})`
    );
  }

  /**
   * Emit ticket priority changed event
   * @param {Object} ticket - Ticket data
   * @param {string} oldPriority - Previous priority
   * @param {string} newPriority - New priority
   * @param {string} changedBy - User who changed the priority
   */
  emitTicketPriorityChanged(ticket, oldPriority, newPriority, changedBy) {
    const recipients = this._getTicketRecipients(ticket, {
      excludeUserId: changedBy,
    });

    this.socketServer.emitToUsers(
      recipients,
      TICKET_EVENTS.TICKET_PRIORITY_CHANGED,
      {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        oldPriority,
        newPriority,
        changedBy,
      }
    );

    // Notify admins for urgent priority
    if (newPriority === "urgent") {
      this.socketServer.emitToRoles(
        ["admin", "super_admin"],
        TICKET_EVENTS.TICKET_PRIORITY_CHANGED,
        {
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          oldPriority,
          newPriority,
          changedBy,
          urgent: true,
        }
      );
    }

    console.log(
      `📨 Ticket priority changed: ${ticket.ticketNumber} (${oldPriority} → ${newPriority})`
    );
  }

  /**
   * Emit comment added event
   * @param {Object} comment - Comment data
   * @param {Object} ticket - Ticket data
   * @param {Object} user - User who added comment
   */
  async emitCommentAdded(comment, ticket, user) {
    const recipients = this._getTicketRecipients(ticket, {
      excludeUserId: user.id,
    });

    const eventData = {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      comment: {
        ...comment,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
      },
    };

    // Get all admin user IDs
    const adminIds = await this._getUserIdsByRoles(["admin", "super_admin"]);
    
    // Combine recipients and admins, removing duplicates
    const allRecipients = new Set([...recipients, ...adminIds]);
    allRecipients.delete(user.id); // Don't notify the commenter
    
    // Emit to all unique recipients
    this.socketServer.emitToUsers(
      Array.from(allRecipients),
      TICKET_EVENTS.COMMENT_ADDED,
      eventData
    );

    // Create notifications
    if (this.notificationService) {
      // Get all recipients (participants + admins, no duplicates)
      const adminIds = await this._getUserIdsByRoles(["admin", "super_admin"]);
      const allRecipients = new Set([...recipients, ...adminIds]);
      
      // Remove the commenter
      allRecipients.delete(user.id);
      
      // Create notifications for all unique recipients
      if (allRecipients.size > 0) {
        await this.notificationService.createBulkNotifications(
          Array.from(allRecipients),
          {
            type: "ticket_comment_added",
            title: "New Comment on Ticket",
            message: `${user.firstName} ${user.lastName} commented on ${ticket.ticketNumber}`,
            entityType: "ticket",
            entityId: ticket.id,
            metadata: {
              ticketNumber: ticket.ticketNumber,
              commenterName: `${user.firstName} ${user.lastName}`,
              creatorProfilePicture: user.profilePictureUrl,
            },
          }
        );
      }
    }

    console.log(`📨 Comment added to ticket: ${ticket.ticketNumber}`);
  }

  /**
   * Emit attachment added event
   * @param {Object} attachment - Attachment data
   * @param {Object} ticket - Ticket data
   * @param {string} uploadedBy - User who uploaded
   */
  emitAttachmentAdded(attachment, ticket, uploadedBy) {
    const recipients = this._getTicketRecipients(ticket, {
      excludeUserId: uploadedBy,
    });

    const eventData = {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      attachment,
      uploadedBy,
    };

    // Notify ticket participants
    this.socketServer.emitToUsers(
      recipients,
      TICKET_EVENTS.ATTACHMENT_ADDED,
      eventData
    );

    // Also notify admins
    this.socketServer.emitToRoles(
      ["admin", "super_admin"],
      TICKET_EVENTS.ATTACHMENT_ADDED,
      eventData
    );

    console.log(`📨 Attachment added to ticket: ${ticket.ticketNumber}`);
  }

  /**
   * Emit attachment deleted event
   * @param {string} attachmentId - Deleted attachment ID
   * @param {Object} ticket - Ticket data
   * @param {string} deletedBy - User who deleted
   */
  emitAttachmentDeleted(attachmentId, ticket, deletedBy) {
    const recipients = this._getTicketRecipients(ticket, {
      excludeUserId: deletedBy,
    });

    const eventData = {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      attachmentId,
      deletedBy,
    };

    // Notify ticket participants
    this.socketServer.emitToUsers(
      recipients,
      TICKET_EVENTS.ATTACHMENT_DELETED,
      eventData
    );

    // Also notify admins
    this.socketServer.emitToRoles(
      ["admin", "super_admin"],
      TICKET_EVENTS.ATTACHMENT_DELETED,
      eventData
    );

    console.log(`📨 Attachment deleted from ticket: ${ticket.ticketNumber}`);
  }

  /**
   * Helper: Get all user IDs with specific roles
   * @param {Array<string>} roles - Array of role names
   * @returns {Promise<Array<string>>} Array of user IDs
   */
  async _getUserIdsByRoles(roles) {
    const { db } = await import("../../db/index.js");
    const { userTable } = await import("../../db/schema.js");
    const { inArray } = await import("drizzle-orm");

    const users = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(inArray(userTable.role, roles));

    return users.map((u) => u.id);
  }

  /**
   * Helper: Create notifications for users with specific roles
   * @param {Array<string>} roles - Target roles
   * @param {Object} notificationData - Notification data
   * @param {string} excludeUserId - User ID to exclude
   */
  async _createNotificationsForRoles(
    roles,
    notificationData,
    excludeUserId = null
  ) {
    const userIds = await this._getUserIdsByRoles(roles);
    const filteredIds = excludeUserId
      ? userIds.filter((id) => id !== excludeUserId)
      : userIds;

    if (filteredIds.length > 0 && this.notificationService) {
      await this.notificationService.createBulkNotifications(
        filteredIds,
        notificationData
      );
    }
  }
}

export default TicketEventEmitter;
