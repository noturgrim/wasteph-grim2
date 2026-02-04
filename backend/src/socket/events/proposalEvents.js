/**
 * Proposal Socket Events
 * Defines all real-time events for the proposal system
 */

export const PROPOSAL_EVENTS = {
  // Proposal lifecycle events
  PROPOSAL_REQUESTED: "proposal:requested",
  PROPOSAL_APPROVED: "proposal:approved",
  PROPOSAL_REJECTED: "proposal:rejected",
  PROPOSAL_SENT: "proposal:sent",
  PROPOSAL_ACCEPTED: "proposal:accepted",
  PROPOSAL_DECLINED: "proposal:declined",
  PROPOSAL_CANCELLED: "proposal:cancelled",
  PROPOSAL_REVISED: "proposal:revised",

  // Subscription events
  SUBSCRIBE_PROPOSAL: "proposal:subscribe",
  UNSUBSCRIBE_PROPOSAL: "proposal:unsubscribe",
  SUBSCRIBE_ALL_PROPOSALS: "proposals:subscribeAll",
  UNSUBSCRIBE_ALL_PROPOSALS: "proposals:unsubscribeAll",
};

/**
 * Proposal Event Emitter
 * Handles all proposal-related socket emissions with proper authorization
 */
class ProposalEventEmitter {
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
   * Emit proposal requested event (Sales → Admin/Super Admin)
   * @param {Object} proposal - Proposal data
   * @param {Object} user - User who requested the proposal
   */
  async emitProposalRequested(proposal, user) {
    try {
      const eventData = {
        proposal: {
          id: proposal.id,
          proposalNumber: proposal.proposalNumber,
          inquiryId: proposal.inquiryId,
          inquiryNumber: proposal.inquiryNumber,
          inquiryName: proposal.inquiryName,
          inquiryEmail: proposal.inquiryEmail,
          inquiryCompany: proposal.inquiryCompany,
          status: proposal.status,
          requestedBy: proposal.requestedBy,
          createdAt: proposal.createdAt,
        },
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      };

      // Notify admin and super_admin roles
      const adminRoles = ["admin", "super_admin"];
      
      // Emit socket event to admins
      this.socketServer.emitToRoles(
        adminRoles,
        PROPOSAL_EVENTS.PROPOSAL_REQUESTED,
        eventData
      );

      // Create database notifications for admins
      if (this.notificationService) {
        const requesterName = `${user.firstName} ${user.lastName}`;
        const message = `${requesterName} requested proposal ${proposal.proposalNumber}`;
        
        // Get all admin/super_admin users
        const adminIds = await this._getAdminUserIds();
        
        // Create bulk notifications
        await this.notificationService.createBulkNotifications({
          userIds: adminIds,
          type: "proposal_requested",
          message,
          entityType: "proposal",
          entityId: proposal.id,
          metadata: {
            proposalNumber: proposal.proposalNumber,
            inquiryNumber: proposal.inquiryNumber,
            inquiryName: proposal.inquiryName,
            requestedBy: {
              id: user.id,
              name: requesterName,
            },
          },
        });
      }

      console.log(`✅ Proposal requested event emitted: ${proposal.proposalNumber}`);
    } catch (error) {
      console.error("Error emitting proposal requested event:", error);
    }
  }

  /**
   * Emit proposal approved event (Admin → Sales)
   * @param {Object} proposal - Proposal data
   * @param {Object} user - User who approved
   */
  async emitProposalApproved(proposal, user) {
    try {
      const eventData = {
        proposal: {
          id: proposal.id,
          proposalNumber: proposal.proposalNumber,
          status: proposal.status,
          approvedBy: proposal.approvedBy,
          approvedAt: proposal.approvedAt,
        },
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };

      // Notify the sales person who requested it
      if (proposal.requestedBy) {
        this.socketServer.emitToUser(
          proposal.requestedBy,
          PROPOSAL_EVENTS.PROPOSAL_APPROVED,
          eventData
        );

        // Create notification
        if (this.notificationService) {
          const approverName = `${user.firstName} ${user.lastName}`;
          await this.notificationService.createNotification({
            userId: proposal.requestedBy,
            type: "proposal_approved",
            message: `${approverName} approved proposal ${proposal.proposalNumber}`,
            entityType: "proposal",
            entityId: proposal.id,
            metadata: {
              proposalNumber: proposal.proposalNumber,
              approvedBy: {
                id: user.id,
                name: approverName,
              },
            },
          });
        }
      }

      console.log(`✅ Proposal approved event emitted: ${proposal.proposalNumber}`);
    } catch (error) {
      console.error("Error emitting proposal approved event:", error);
    }
  }

  /**
   * Emit proposal rejected event (Admin → Sales)
   * @param {Object} proposal - Proposal data
   * @param {Object} user - User who rejected
   */
  async emitProposalRejected(proposal, user) {
    try {
      const eventData = {
        proposal: {
          id: proposal.id,
          proposalNumber: proposal.proposalNumber,
          status: proposal.status,
          rejectionReason: proposal.rejectionReason,
        },
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };

      // Notify the sales person who requested it
      if (proposal.requestedBy) {
        this.socketServer.emitToUser(
          proposal.requestedBy,
          PROPOSAL_EVENTS.PROPOSAL_REJECTED,
          eventData
        );

        // Create notification
        if (this.notificationService) {
          const rejectorName = `${user.firstName} ${user.lastName}`;
          await this.notificationService.createNotification({
            userId: proposal.requestedBy,
            type: "proposal_rejected",
            message: `${rejectorName} rejected proposal ${proposal.proposalNumber}`,
            entityType: "proposal",
            entityId: proposal.id,
            metadata: {
              proposalNumber: proposal.proposalNumber,
              rejectionReason: proposal.rejectionReason,
              rejectedBy: {
                id: user.id,
                name: rejectorName,
              },
            },
          });
        }
      }

      console.log(`✅ Proposal rejected event emitted: ${proposal.proposalNumber}`);
    } catch (error) {
      console.error("Error emitting proposal rejected event:", error);
    }
  }

  /**
   * Emit proposal sent event (Sales → Admin + Sales)
   * @param {Object} proposal - Proposal data
   * @param {Object} user - User who sent the proposal
   */
  async emitProposalSent(proposal, user) {
    try {
      const eventData = {
        proposal: {
          id: proposal.id,
          proposalNumber: proposal.proposalNumber,
          status: proposal.status,
          sentAt: proposal.sentAt,
        },
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };

      // Notify admins
      this.socketServer.emitToRoles(
        ["admin", "super_admin"],
        PROPOSAL_EVENTS.PROPOSAL_SENT,
        eventData
      );

      // Create notifications for admins
      if (this.notificationService) {
        const senderName = `${user.firstName} ${user.lastName}`;
        const adminIds = await this._getAdminUserIds();
        
        await this.notificationService.createBulkNotifications({
          userIds: adminIds,
          type: "proposal_sent",
          message: `${senderName} sent proposal ${proposal.proposalNumber} to client`,
          entityType: "proposal",
          entityId: proposal.id,
          metadata: {
            proposalNumber: proposal.proposalNumber,
            sentBy: {
              id: user.id,
              name: senderName,
            },
          },
        });
      }

      console.log(`✅ Proposal sent event emitted: ${proposal.proposalNumber}`);
    } catch (error) {
      console.error("Error emitting proposal sent event:", error);
    }
  }

  /**
   * Get all admin user IDs
   * @returns {Promise<Array<string>>} Array of admin user IDs
   */
  async _getAdminUserIds() {
    try {
      // Import here to avoid circular dependency
      const { db } = await import("../../db/index.js");
      const { usersTable } = await import("../../db/schema.js");
      const { inArray } = await import("drizzle-orm");

      const admins = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(inArray(usersTable.role, ["admin", "super_admin"]));

      return admins.map((admin) => admin.id);
    } catch (error) {
      console.error("Error getting admin user IDs:", error);
      return [];
    }
  }

  /**
   * Register socket event listeners
   * @param {Object} socket - Socket.IO socket instance
   */
  registerListeners(socket) {
    // Subscribe to all proposals
    socket.on(PROPOSAL_EVENTS.SUBSCRIBE_ALL_PROPOSALS, () => {
      socket.join("proposals");
      console.log(`User ${socket.userId} subscribed to all proposals`);
    });

    // Unsubscribe from all proposals
    socket.on(PROPOSAL_EVENTS.UNSUBSCRIBE_ALL_PROPOSALS, () => {
      socket.leave("proposals");
      console.log(`User ${socket.userId} unsubscribed from all proposals`);
    });

    // Subscribe to specific proposal
    socket.on(PROPOSAL_EVENTS.SUBSCRIBE_PROPOSAL, ({ proposalId }) => {
      socket.join(`proposal:${proposalId}`);
      console.log(`User ${socket.userId} subscribed to proposal ${proposalId}`);
    });

    // Unsubscribe from specific proposal
    socket.on(PROPOSAL_EVENTS.UNSUBSCRIBE_PROPOSAL, ({ proposalId }) => {
      socket.leave(`proposal:${proposalId}`);
      console.log(`User ${socket.userId} unsubscribed from proposal ${proposalId}`);
    });
  }
}

export default ProposalEventEmitter;
