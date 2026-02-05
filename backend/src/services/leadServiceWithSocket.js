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
   * Create a new lead (override to add socket emission)
   */
  async createLead(leadData, userId, metadata = {}) {
    const lead = await super.createLead(leadData, userId, metadata);

    // Emit socket event
    if (this.leadEvents) {
      await this.leadEvents.emitLeadCreated(lead, { isPublic: false });
    }

    return lead;
  }

  /**
   * Create a new lead from public landing page (override to add socket emission)
   */
  async createPublicLead(leadData, metadata = {}) {
    const lead = await super.createPublicLead(leadData, metadata);

    // Emit socket event with public flag
    if (this.leadEvents) {
      await this.leadEvents.emitLeadCreated(lead, { isPublic: true });
    }

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

    // Emit socket event
    if (this.leadEvents) {
      this.leadEvents.emitLeadClaimed(lead, inquiry, userId);
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
