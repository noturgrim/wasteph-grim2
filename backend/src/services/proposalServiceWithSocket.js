import proposalService from "./proposalService.js";
import ProposalEventEmitter from "../socket/events/proposalEvents.js";

/**
 * ProposalServiceWithSocket - Extends ProposalService with real-time socket events
 * Wraps core proposal operations and emits socket events after successful operations
 */
class ProposalServiceWithSocket {
  constructor() {
    this.proposalService = proposalService;
    this.proposalEvents = null;
  }

  /**
   * Initialize socket event emitter
   * @param {Object} socketServer - Socket server instance
   */
  initializeSocket(socketServer) {
    this.proposalEvents = new ProposalEventEmitter(socketServer);
    console.log("✅ Proposal socket events initialized");
  }

  /**
   * Set notification service
   * @param {Object} notificationService - NotificationService instance
   */
  setNotificationService(notificationService) {
    if (this.proposalEvents) {
      this.proposalEvents.setNotificationService(notificationService);
    }
  }

  /**
   * Create proposal with socket emission
   * @param {Object} proposalData - Proposal data
   * @param {string} userId - User creating proposal
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Created proposal
   */
  async createProposal(proposalData, userId, metadata = {}) {
    // Create proposal using core service
    const proposal = await this.proposalService.createProposal(
      proposalData,
      userId,
      metadata
    );

    // Emit socket event if initialized
    if (this.proposalEvents) {
      // Get user details
      const { db } = await import("../db/index.js");
      const { usersTable } = await import("../db/schema.js");
      const { eq } = await import("drizzle-orm");

      const [user] = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
          role: usersTable.role,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId));

      if (user) {
        await this.proposalEvents.emitProposalRequested(proposal, user);
      }
    }

    return proposal;
  }

  /**
   * Approve proposal with socket emission
   * @param {string} proposalId - Proposal ID
   * @param {string} userId - User approving
   * @param {string} adminNotes - Admin notes
   * @returns {Promise<Object>} Updated proposal
   */
  async approveProposal(proposalId, userId, adminNotes = "") {
    const proposal = await this.proposalService.approveProposal(
      proposalId,
      userId,
      adminNotes
    );

    // Emit socket event
    if (this.proposalEvents) {
      const { db } = await import("../db/index.js");
      const { usersTable } = await import("../db/schema.js");
      const { eq } = await import("drizzle-orm");

      const [user] = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId));

      if (user) {
        await this.proposalEvents.emitProposalApproved(proposal, user);
      }
    }

    return proposal;
  }

  /**
   * Reject proposal with socket emission
   * @param {string} proposalId - Proposal ID
   * @param {string} userId - User rejecting
   * @param {string} rejectionReason - Rejection reason
   * @returns {Promise<Object>} Updated proposal
   */
  async rejectProposal(proposalId, userId, rejectionReason) {
    const proposal = await this.proposalService.rejectProposal(
      proposalId,
      userId,
      rejectionReason
    );

    // Emit socket event
    if (this.proposalEvents) {
      const { db } = await import("../db/index.js");
      const { usersTable } = await import("../db/schema.js");
      const { eq } = await import("drizzle-orm");

      const [user] = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId));

      if (user) {
        await this.proposalEvents.emitProposalRejected(proposal, user);
      }
    }

    return proposal;
  }

  /**
   * Send proposal to client with socket emission
   * @param {string} proposalId - Proposal ID
   * @param {string} userId - User sending
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Updated proposal
   */
  async sendProposalToClient(proposalId, userId, emailData) {
    const proposal = await this.proposalService.sendProposalToClient(
      proposalId,
      userId,
      emailData
    );

    // Emit socket event
    if (this.proposalEvents) {
      const { db } = await import("../db/index.js");
      const { usersTable } = await import("../db/schema.js");
      const { eq } = await import("drizzle-orm");

      const [user] = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId));

      if (user) {
        await this.proposalEvents.emitProposalSent(proposal, user);
      }
    }

    return proposal;
  }

  // Proxy all other methods to core service
  async getProposals(filters) {
    return this.proposalService.getProposals(filters);
  }

  async getProposalById(proposalId) {
    return this.proposalService.getProposalById(proposalId);
  }

  async updateProposal(proposalId, updateData, userId, metadata = {}) {
    return this.proposalService.updateProposal(
      proposalId,
      updateData,
      userId,
      metadata
    );
  }

  async cancelProposal(proposalId, userId, metadata = {}) {
    return this.proposalService.cancelProposal(proposalId, userId, metadata);
  }

  async getProposalHtmlPreview(proposalId) {
    return this.proposalService.getProposalHtmlPreview(proposalId);
  }

  async renderProposalAsPdf(proposalId) {
    return this.proposalService.renderProposalAsPdf(proposalId);
  }

  async acceptProposalPublic(proposalId, acceptanceToken) {
    return this.proposalService.acceptProposalPublic(
      proposalId,
      acceptanceToken
    );
  }

  async declineProposalPublic(proposalId, acceptanceToken, declineReason = "") {
    return this.proposalService.declineProposalPublic(
      proposalId,
      acceptanceToken,
      declineReason
    );
  }

  async uploadRevisions(proposalId, file, userId, metadata = {}) {
    return this.proposalService.uploadRevisions(
      proposalId,
      file,
      userId,
      metadata
    );
  }

  async getRevisions(proposalId) {
    return this.proposalService.getRevisions(proposalId);
  }
}

export default new ProposalServiceWithSocket();
