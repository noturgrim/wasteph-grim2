import LeadService from "./leadService.js";
import LeadEventEmitter from "../socket/events/leadEvents.js";

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
      ?.catch?.((err) => console.error("[LeadSocket] emit failed:", err.message));

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
      ?.catch?.((err) => console.error("[LeadSocket] emit failed:", err.message));

    return lead;
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
    const inquiry = await super.claimLead(leadId, userId, source, metadata);

    // Get the updated lead
    const lead = await this.getLeadById(leadId);

    // Get user details for notification
    const { db } = await import("../db/index.js");
    const { userTable } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");

    const [user] = await db
      .select({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    // Emit socket event
    if (this.leadEvents && user) {
      await this.leadEvents.emitLeadClaimed(lead, inquiry, user);
    }

    return inquiry;
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
