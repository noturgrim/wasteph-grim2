import proposalService from "./proposalService.js";
import ProposalEventEmitter from "../socket/events/proposalEvents.js";
import emailService from "./emailService.js";

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
  async approveProposal(proposalId, userId, adminNotes = "", metadata = {}) {
    const proposal = await this.proposalService.approveProposal(
      proposalId,
      userId,
      adminNotes,
      metadata,
    );

    // Fire-and-forget: emit socket event
    if (this.proposalEvents && proposal) {
      this._emitApprovalEvent(proposal, userId);
    }

    return proposal;
  }

  /** @private */
  _emitApprovalEvent(proposal, userId) {
    Promise.resolve()
      .then(async () => {
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
        }
      })
      .catch((err) => console.error("Error emitting proposal approved event:", err));
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
    const proposal = await this.proposalService.sendProposal(
      proposalId,
      userId,
      emailData,
    );

    // Fire-and-forget: emit socket event
    if (this.proposalEvents && proposal) {
      this._emitSentEvent(proposal, userId);
    }

    return proposal;
  }

  /** @private */
  _emitSentEvent(proposal, userId) {
    Promise.resolve()
      .then(async () => {
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
        }
      })
      .catch((err) => console.error("Error emitting proposal sent event:", err));
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

  /**
   * Record client approval with socket emission
   * @param {string} proposalId - Proposal ID
   * @param {string} ipAddress - Client IP address
   * @returns {Promise<Object>} Updated proposal
   */
  async recordClientApproval(proposalId, ipAddress) {
    const proposal = await this.proposalService.recordClientApproval(
      proposalId,
      ipAddress,
    );

    // Fire-and-forget: emit socket event
    if (this.proposalEvents && proposal) {
      this._emitClientResponseEvent(proposal, "accepted");
    }

    return proposal;
  }

  async recordClientRejection(proposalId, ipAddress) {
    const proposal = await this.proposalService.recordClientRejection(
      proposalId,
      ipAddress,
    );

    // Fire-and-forget: emit socket event
    if (this.proposalEvents && proposal) {
      this._emitClientResponseEvent(proposal, "declined");
    }

    return proposal;
  }

  /** @private Fire-and-forget socket emission for client responses */
  _emitClientResponseEvent(proposal, type) {
    Promise.resolve()
      .then(async () => {
        const { db } = await import("../db/index.js");
        const { proposalTable, inquiryTable, userTable } = await import("../db/schema.js");
        const { eq } = await import("drizzle-orm");

        const [fullProposal] = await db
          .select({
            id: proposalTable.id,
            proposalNumber: proposalTable.proposalNumber,
            status: proposalTable.status,
            requestedBy: proposalTable.requestedBy,
            clientResponseAt: proposalTable.clientResponseAt,
            inquiryName: inquiryTable.name,
            inquiryCompany: inquiryTable.company,
            inquiryEmail: inquiryTable.email,
            userEmail: userTable.email,
          })
          .from(proposalTable)
          .leftJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id))
          .leftJoin(userTable, eq(proposalTable.requestedBy, userTable.id))
          .where(eq(proposalTable.id, proposal.id))
          .limit(1);

        if (fullProposal) {
          // Emit socket event
          if (type === "accepted") {
            await this.proposalEvents.emitProposalAccepted(fullProposal);
          } else {
            await this.proposalEvents.emitProposalDeclined(fullProposal);
          }

          // Send email notification to sales person
          if (fullProposal.userEmail) {
            const emailData = {
              clientName: fullProposal.inquiryName,
              proposalNumber: fullProposal.proposalNumber,
              action: type,
              companyName: fullProposal.inquiryCompany,
              clientEmail: fullProposal.inquiryEmail,
            };

            emailService
              .sendProposalResponseNotification(fullProposal.userEmail, emailData)
              .catch((err) =>
                console.error(`Failed to send ${type} email to ${fullProposal.userEmail}:`, err.message),
              );
          }
        }
      })
      .catch((err) =>
        console.error(`Error emitting proposal ${type} event:`, err),
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

  async validateResponseToken(proposalId, token) {
    return this.proposalService.validateResponseToken(proposalId, token);
  }

  async retryProposalEmail(proposalId, userId, metadata = {}) {
    return this.proposalService.retryProposalEmail(
      proposalId,
      userId,
      metadata
    );
  }

  async readPDF(pdfUrl) {
    return this.proposalService.readPDF(pdfUrl);
  }

  async generatePreviewPDF(proposalOrId) {
    return this.proposalService.generatePreviewPDF(proposalOrId);
  }
}

export default new ProposalServiceWithSocket();
