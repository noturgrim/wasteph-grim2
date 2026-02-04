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
    if (this.proposalEvents && proposal?.id) {
      try {
        // Get full proposal with inquiry data for socket emission
        const { db } = await import("../db/index.js");
        const schema = await import("../db/schema.js");
        const { proposalTable, inquiryTable, userTable } = schema;
        const { eq } = await import("drizzle-orm");

        console.log(
          `🔍 Fetching proposal ${proposal.id} for socket emission...`
        );

        const fullProposalResult = await db
          .select({
            id: proposalTable.id,
            proposalNumber: proposalTable.proposalNumber,
            inquiryId: proposalTable.inquiryId,
            status: proposalTable.status,
            requestedBy: proposalTable.requestedBy,
            createdAt: proposalTable.createdAt,
            // Inquiry details
            inquiryName: inquiryTable.name,
            inquiryEmail: inquiryTable.email,
            inquiryCompany: inquiryTable.company,
            inquiryNumber: inquiryTable.inquiryNumber,
          })
          .from(proposalTable)
          .leftJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id))
          .where(eq(proposalTable.id, proposal.id))
          .limit(1);

        const fullProposal = fullProposalResult[0];

        if (!fullProposal) {
          console.warn(`⚠️ Full proposal not found: ${proposal.id}`);
          return proposal;
        }

        console.log(`✅ Found proposal: ${fullProposal.proposalNumber}`);

        // Get user details
        console.log(`🔍 Fetching user ${userId} for socket emission...`);

        const userResult = await db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            email: userTable.email,
            role: userTable.role,
          })
          .from(userTable)
          .where(eq(userTable.id, userId));

        const user = userResult[0];

        if (!user) {
          console.warn(`⚠️ User not found for proposal emission: ${userId}`);
          return proposal;
        }

        console.log(`✅ Found user: ${user.email}`);

        // Emit the event
        await this.proposalEvents.emitProposalRequested(fullProposal, user);
        console.log(`✅ Proposal requested event emitted successfully`);
      } catch (error) {
        console.error("❌ Error emitting proposal requested event:", error);
        // Don't throw - proposal was created successfully, just log the socket error
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
    if (this.proposalEvents && proposal) {
      try {
        const { db } = await import("../db/index.js");
        const { userTable } = await import("../db/schema.js");
        const { eq } = await import("drizzle-orm");

        const [user] = await db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
          })
          .from(userTable)
          .where(eq(userTable.id, userId));

        if (user) {
          await this.proposalEvents.emitProposalApproved(proposal, user);
        } else {
          console.warn(
            `User not found for proposal approval emission: ${userId}`
          );
        }
      } catch (error) {
        console.error("Error emitting proposal approved event:", error);
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
    if (this.proposalEvents && proposal) {
      try {
        const { db } = await import("../db/index.js");
        const { userTable } = await import("../db/schema.js");
        const { eq } = await import("drizzle-orm");

        const [user] = await db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
          })
          .from(userTable)
          .where(eq(userTable.id, userId));

        if (user) {
          await this.proposalEvents.emitProposalRejected(proposal, user);
        } else {
          console.warn(
            `User not found for proposal rejection emission: ${userId}`
          );
        }
      } catch (error) {
        console.error("Error emitting proposal rejected event:", error);
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
    if (this.proposalEvents && proposal) {
      try {
        const { db } = await import("../db/index.js");
        const { userTable } = await import("../db/schema.js");
        const { eq } = await import("drizzle-orm");

        const [user] = await db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
          })
          .from(userTable)
          .where(eq(userTable.id, userId));

        if (user) {
          await this.proposalEvents.emitProposalSent(proposal, user);
        } else {
          console.warn(`User not found for proposal sent emission: ${userId}`);
        }
      } catch (error) {
        console.error("Error emitting proposal sent event:", error);
      }
    }

    return proposal;
  }

  // Proxy all other methods to core service
  async getProposals(options, userId, userRole, isMasterSales) {
    return this.proposalService.getAllProposals(
      options,
      userId,
      userRole,
      isMasterSales
    );
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
