import LeadService from "./leadService.js";
import LeadEventEmitter from "../socket/events/leadEvents.js";
import { db } from "../db/index.js";
import { userTable } from "../db/schema.js";
import { eq, or, inArray } from "drizzle-orm";
import emailService from "./emailService.js";

/**
 * LeadService with Real-Time Socket Support
 * Extends LeadService with socket event emissions
 */
class LeadServiceWithSocket extends LeadService {
  constructor() {
    super();
    this.leadEvents = null;
  }

  /**
   * Initialize socket event emitter
   * @param {Object} socketServer - Socket server instance
   */
  initializeSocket(socketServer) {
    this.leadEvents = new LeadEventEmitter(socketServer);
    console.log("✅ Lead socket events initialized");
  }

  /**
   * Set notification service
   * @param {Object} notificationService - NotificationService instance
   */
  setNotificationService(notificationService) {
    if (this.leadEvents) {
      this.leadEvents.setNotificationService(notificationService);
    }
  }

  /**
   * Create a new lead (override to add socket emission)
   */
  async createLead(leadData, userId, metadata = {}) {
    const lead = await super.createLead(leadData, userId, metadata);

    // Fire-and-forget socket event — don't block the response
    this.leadEvents
      ?.emitLeadCreated(lead, { isPublic: false })
      ?.catch?.((err) =>
        console.error("[LeadSocket] emit failed:", err.message),
      );

    return lead;
  }

  /**
   * Create a new lead from public landing page (override to add socket emission)
   */
  async createPublicLead(leadData, metadata = {}) {
    const lead = await super.createPublicLead(leadData, metadata);

    // Fire-and-forget socket event — don't block the response
    this.leadEvents
      ?.emitLeadCreated(lead, { isPublic: true })
      ?.catch?.((err) =>
        console.error("[LeadSocket] emit failed:", err.message),
      );

    // Fire-and-forget email notifications to all sales users
    this._sendNewLeadEmailNotifications(lead).catch((err) =>
      console.error("[LeadEmail] notification failed:", err.message),
    );

    return lead;
  }

  /**
   * Send email notifications to all sales users for new lead
   * @param {Object} lead - Created lead object
   * @private
   */
  async _sendNewLeadEmailNotifications(lead) {
    try {
      // Fetch all sales users (role='sales' or isMasterSales=true)
      const salesUsers = await db
        .select({
          id: userTable.id,
          email: userTable.email,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
        })
        .from(userTable)
        .where(
          or(
            eq(userTable.role, "sales"),
            eq(userTable.isMasterSales, true),
          ),
        );

      if (salesUsers.length === 0) {
        console.log("ℹ️  No sales users found to notify");
        return;
      }

      // Prepare lead data for email template
      const emailData = {
        name: lead.clientName,
        email: lead.email,
        phoneNumber: lead.phone,
        companyName: lead.company,
        serviceInterest: lead.location, // Using location as service interest
        message: lead.notes,
      };

      // Send emails to all sales users
      const emailPromises = salesUsers.map((user) =>
        emailService.sendNewLeadNotification(user.email, emailData),
      );

      const results = await Promise.allSettled(emailPromises);

      const successCount = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
      const failCount = results.length - successCount;

      console.log(`📧 New lead email notifications: ${successCount} sent, ${failCount} failed`);
    } catch (error) {
      console.error("❌ Failed to send new lead email notifications:", error);
      // Don't throw — email failures shouldn't block the lead creation
    }
  }

  /**
   * Update lead (override to add socket emission)
   */
  async updateLead(leadId, updateData, userId, metadata = {}) {
    const lead = await super.updateLead(leadId, updateData, userId, metadata);

    // Emit socket event
    if (this.leadEvents) {
      this.leadEvents.emitLeadUpdated(lead, updateData, userId);
    }

    return lead;
  }

  /**
   * Claim a lead (override to add socket emission)
   */
  async claimLead(leadId, userId, source, metadata = {}) {
    const { inquiry, lead } = await super.claimLead(
      leadId,
      userId,
      source,
      metadata,
    );

    // Fire-and-forget: fetch user details + emit socket in background
    if (this.leadEvents) {
      db.select({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
      })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1)
        .then(([user]) => {
          if (user) {
            return this.leadEvents.emitLeadClaimed(lead, inquiry, user);
          }
        })
        .catch((err) =>
          console.error("[LeadSocket] claim emit failed:", err.message),
        );
    }

    return { inquiry, lead };
  }

  /**
   * Delete lead (override to add socket emission)
   */
  async deleteLead(leadId, userId, metadata = {}) {
    const lead = await super.deleteLead(leadId, userId, metadata);

    // Emit socket event
    if (this.leadEvents) {
      this.leadEvents.emitLeadDeleted(leadId, userId);
    }

    return lead;
  }

  /**
   * Bulk delete leads (override to add socket emissions)
   */
  async bulkDeleteLeads(leadIds, userId, metadata = {}) {
    const results = await super.bulkDeleteLeads(leadIds, userId, metadata);

    // Emit socket events for each successfully deleted lead
    if (this.leadEvents && results.deleted > 0) {
      leadIds.forEach((leadId) => {
        this.leadEvents.emitLeadDeleted(leadId, userId);
      });
    }

    return results;
  }
}

// Export singleton instance
const leadServiceWithSocket = new LeadServiceWithSocket();
export default leadServiceWithSocket;
