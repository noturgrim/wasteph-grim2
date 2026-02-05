/**
 * Lead Socket Events
 * Defines all real-time events for the lead system
 */

export const LEAD_EVENTS = {
  // Lead lifecycle events
  LEAD_CREATED: "lead:created",
  LEAD_UPDATED: "lead:updated",
  LEAD_CLAIMED: "lead:claimed",
  LEAD_DELETED: "lead:deleted",

  // Subscription events
  SUBSCRIBE_LEADS: "leads:subscribe",
  UNSUBSCRIBE_LEADS: "leads:unsubscribe",
};

/**
 * Lead Event Emitter
 * Handles all lead-related socket emissions with proper authorization
 */
class LeadEventEmitter {
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
   * Emit lead created event
   * Notifies all sales and admin users about new lead
   * @param {Object} lead - Created lead
   * @param {Object} options - Additional options
   */
  async emitLeadCreated(lead, options = {}) {
    const { isPublic = false } = options;

    // Get all users who can view leads (sales, admin, super_admin)
    const recipients = await this._getUserIdsByRoles([
      "sales",
      "admin",
      "super_admin",
    ]);

    // Emit to all authorized users (for real-time table updates)
    this.socketServer.emitToUsers(recipients, LEAD_EVENTS.LEAD_CREATED, {
      lead,
      isPublic, // Flag to indicate if this came from landing page
      timestamp: new Date().toISOString(),
    });

    // Create database notifications ONLY for public leads from landing page
    if (isPublic && this.notificationService && recipients.length > 0) {
      const leadName = lead.company || lead.clientName;

      await this.notificationService.createBulkNotifications(recipients, {
        type: "lead_created_public",
        title: "New Lead from Website",
        message: `${leadName} submitted an inquiry from the landing page`,
        entityType: "lead",
        entityId: lead.id,
        metadata: {
          company: lead.company,
          clientName: lead.clientName,
          email: lead.email,
          phone: lead.phone,
          location: lead.location,
          isPublic: true,
        },
      });
    }

    console.log(
      `📨 Lead created event emitted: ${lead.company || lead.clientName} ${
        isPublic ? "(from landing page)" : ""
      }`
    );
  }

  /**
   * Emit lead updated event
   * @param {Object} lead - Updated lead
   * @param {Object} changes - Changed fields
   * @param {string} updatedBy - User who updated the lead
   */
  emitLeadUpdated(lead, changes, updatedBy) {
    // Emit to all authorized users (for real-time table updates)
    // No database notification needed - just real-time socket update
    this.socketServer.emitToRoles(
      ["sales", "admin", "super_admin"],
      LEAD_EVENTS.LEAD_UPDATED,
      {
        leadId: lead.id,
        lead,
        changes,
        updatedBy,
        timestamp: new Date().toISOString(),
      }
    );

    console.log(`📨 Lead updated event emitted: ${lead.id}`);
  }

  /**
   * Emit lead claimed event
   * @param {Object} lead - Claimed lead
   * @param {Object} inquiry - Created inquiry from lead
   * @param {Object} user - User who claimed the lead
   */
  async emitLeadClaimed(lead, inquiry, user) {
    // Emit to all authorized users (for real-time table updates)
    // No database notification needed - just real-time socket update
    this.socketServer.emitToRoles(
      ["sales", "admin", "super_admin"],
      LEAD_EVENTS.LEAD_CLAIMED,
      {
        leadId: lead.id,
        lead,
        inquiry,
        claimedBy: user.id,
        timestamp: new Date().toISOString(),
      }
    );

    console.log(`📨 Lead claimed event emitted: ${lead.id} by ${user.id}`);
  }

  /**
   * Emit lead deleted event
   * @param {string} leadId - Deleted lead ID
   * @param {string} deletedBy - User who deleted the lead
   */
  emitLeadDeleted(leadId, deletedBy) {
    // Emit to all authorized users (for real-time table updates)
    // No database notification needed - just real-time socket update
    this.socketServer.emitToRoles(
      ["sales", "admin", "super_admin"],
      LEAD_EVENTS.LEAD_DELETED,
      {
        leadId,
        deletedBy,
        timestamp: new Date().toISOString(),
      }
    );

    console.log(`📨 Lead deleted event emitted: ${leadId}`);
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
}

export default LeadEventEmitter;
