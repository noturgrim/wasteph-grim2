/**
 * Proposal Socket Events
 * Defines all real-time events for the proposal system
 */

import proposalService from "../../services/proposalService.js";
import emailService from "../../services/email/emailService.js";

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
          profilePictureUrl: user.profilePictureUrl,
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
        await this.notificationService.createBulkNotifications(adminIds, {
          type: "proposal_requested",
          title: "New Proposal Request",
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
            creatorName: requesterName,
          },
        });

        // Send email notifications to admins (fire-and-forget)
        const adminEmails = await this._getAdminEmails();
        if (adminEmails.length > 0) {
          emailService
            .sendProposalRequestedNotification(adminEmails, {
              proposalNumber: proposal.proposalNumber,
              inquiryNumber: proposal.inquiryNumber,
              inquiryName: proposal.inquiryName,
              inquiryCompany: proposal.inquiryCompany,
              inquiryEmail: proposal.inquiryEmail,
              requestedBy: requesterName,
              createdAt: proposal.createdAt,
            })
            .catch((err) =>
              console.error(
                `Failed to send proposal requested email to admins:`,
                err.message
              )
            );
        }
      }

      console.log(
        `✅ Proposal requested event emitted: ${proposal.proposalNumber}`
      );
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
            title: "Proposal Approved",
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

      console.log(
        `✅ Proposal approved event emitted: ${proposal.proposalNumber}`
      );
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
            title: "Proposal Rejected",
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

      console.log(
        `✅ Proposal rejected event emitted: ${proposal.proposalNumber}`
      );
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

        await this.notificationService.createBulkNotifications(adminIds, {
          type: "proposal_sent",
          title: "Proposal Sent to Client",
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
   * Emit proposal accepted by client event (Client → Sales + Admin)
   * @param {Object} proposal - Proposal data
   */
  async emitProposalAccepted(proposal) {
    try {
      const eventData = {
        proposal: {
          id: proposal.id,
          proposalNumber: proposal.proposalNumber,
          status: proposal.status,
          clientResponseAt: proposal.clientResponseAt,
          inquiryName: proposal.inquiryName,
          inquiryCompany: proposal.inquiryCompany,
        },
      };

      // Notify the sales person who created it
      if (proposal.requestedBy) {
        this.socketServer.emitToUser(
          proposal.requestedBy,
          PROPOSAL_EVENTS.PROPOSAL_ACCEPTED,
          eventData
        );

        // Create notification for sales person
        if (this.notificationService) {
          await this.notificationService.createNotification({
            userId: proposal.requestedBy,
            type: "proposal_accepted",
            title: "Client Accepted Proposal",
            message: `Client accepted proposal ${proposal.proposalNumber}`,
            entityType: "proposal",
            entityId: proposal.id,
            metadata: {
              proposalNumber: proposal.proposalNumber,
              inquiryName: proposal.inquiryName,
              inquiryCompany: proposal.inquiryCompany,
              acceptedAt: proposal.clientResponseAt,
            },
          });
        }
      }

      // Also notify admins
      this.socketServer.emitToRoles(
        ["admin", "super_admin"],
        PROPOSAL_EVENTS.PROPOSAL_ACCEPTED,
        eventData
      );

      // Create notifications for admins
      if (this.notificationService) {
        const adminIds = await this._getAdminUserIds();

        await this.notificationService.createBulkNotifications(adminIds, {
          type: "proposal_accepted",
          title: "Client Accepted Proposal",
          message: `Client accepted proposal ${proposal.proposalNumber}`,
          entityType: "proposal",
          entityId: proposal.id,
          metadata: {
            proposalNumber: proposal.proposalNumber,
            inquiryName: proposal.inquiryName,
            inquiryCompany: proposal.inquiryCompany,
            acceptedAt: proposal.clientResponseAt,
          },
        });
      }

      console.log(
        `✅ Proposal accepted event emitted: ${proposal.proposalNumber}`
      );
    } catch (error) {
      console.error("Error emitting proposal accepted event:", error);
    }
  }

  /**
   * Emit proposal revised event (Sales → Admin)
   * When sales person submits a revision after admin disapproval
   * @param {Object} proposal - Proposal data
   * @param {Object} user - User who revised the proposal
   */
  async emitProposalRevised(proposal, user) {
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
          updatedAt: proposal.updatedAt,
        },
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profilePictureUrl: user.profilePictureUrl,
        },
      };

      // Notify admin and super_admin roles
      const adminRoles = ["admin", "super_admin"];

      // Emit socket event to admins
      this.socketServer.emitToRoles(
        adminRoles,
        PROPOSAL_EVENTS.PROPOSAL_REVISED,
        eventData
      );

      // Create database notifications for admins
      if (this.notificationService) {
        const reviserName = `${user.firstName} ${user.lastName}`;
        const message = `${reviserName} submitted revision for proposal ${proposal.proposalNumber}`;

        // Get all admin/super_admin users
        const adminIds = await this._getAdminUserIds();

        // Create bulk notifications (using "proposal_requested" type for revision)
        await this.notificationService.createBulkNotifications(adminIds, {
          type: "proposal_requested",
          title: "Proposal Revision Submitted",
          message,
          entityType: "proposal",
          entityId: proposal.id,
          metadata: {
            proposalNumber: proposal.proposalNumber,
            inquiryNumber: proposal.inquiryNumber,
            inquiryName: proposal.inquiryName,
            revisedBy: {
              id: user.id,
              name: reviserName,
            },
            creatorName: reviserName,
            isRevision: true,
          },
        });

        // Send email notifications to admins (fire-and-forget)
        const adminEmails = await this._getAdminEmails();
        if (adminEmails.length > 0) {
          emailService
            .sendProposalRequestedNotification(adminEmails, {
              proposalNumber: proposal.proposalNumber,
              inquiryNumber: proposal.inquiryNumber,
              inquiryName: proposal.inquiryName,
              inquiryCompany: proposal.inquiryCompany,
              inquiryEmail: proposal.inquiryEmail,
              requestedBy: reviserName,
              createdAt: proposal.updatedAt,
            })
            .catch((err) =>
              console.error(
                `Failed to send proposal revision email to admins:`,
                err.message
              )
            );
        }
      }

      console.log(
        `✅ Proposal revised event emitted: ${proposal.proposalNumber}`
      );
    } catch (error) {
      console.error("Error emitting proposal revised event:", error);
    }
  }

  /**
   * Emit proposal declined by client event (Client → Sales + Admin)
   * @param {Object} proposal - Proposal data
   */
  async emitProposalDeclined(proposal) {
    try {
      const eventData = {
        proposal: {
          id: proposal.id,
          proposalNumber: proposal.proposalNumber,
          status: proposal.status,
          clientResponseAt: proposal.clientResponseAt,
          inquiryName: proposal.inquiryName,
          inquiryCompany: proposal.inquiryCompany,
        },
      };

      // Notify the sales person who created it
      if (proposal.requestedBy) {
        this.socketServer.emitToUser(
          proposal.requestedBy,
          PROPOSAL_EVENTS.PROPOSAL_DECLINED,
          eventData
        );

        // Create notification for sales person
        if (this.notificationService) {
          await this.notificationService.createNotification({
            userId: proposal.requestedBy,
            type: "proposal_declined",
            title: "Client Declined Proposal",
            message: `Client declined proposal ${proposal.proposalNumber}`,
            entityType: "proposal",
            entityId: proposal.id,
            metadata: {
              proposalNumber: proposal.proposalNumber,
              inquiryName: proposal.inquiryName,
              inquiryCompany: proposal.inquiryCompany,
              declinedAt: proposal.clientResponseAt,
            },
          });
        }
      }

      // Also notify admins
      this.socketServer.emitToRoles(
        ["admin", "super_admin"],
        PROPOSAL_EVENTS.PROPOSAL_DECLINED,
        eventData
      );

      // Create notifications for admins
      if (this.notificationService) {
        const adminIds = await this._getAdminUserIds();

        await this.notificationService.createBulkNotifications(adminIds, {
          type: "proposal_declined",
          title: "Client Declined Proposal",
          message: `Client declined proposal ${proposal.proposalNumber}`,
          entityType: "proposal",
          entityId: proposal.id,
          metadata: {
            proposalNumber: proposal.proposalNumber,
            inquiryName: proposal.inquiryName,
            inquiryCompany: proposal.inquiryCompany,
            declinedAt: proposal.clientResponseAt,
          },
        });
      }

      console.log(
        `✅ Proposal declined event emitted: ${proposal.proposalNumber}`
      );
    } catch (error) {
      console.error("Error emitting proposal declined event:", error);
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
      const { userTable } = await import("../../db/schema.js");
      const { inArray } = await import("drizzle-orm");

      const admins = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(inArray(userTable.role, ["admin", "super_admin"]));

      return admins.map((admin) => admin.id);
    } catch (error) {
      console.error("Error getting admin user IDs:", error);
      return [];
    }
  }

  /**
   * Get all admin user emails
   * @returns {Promise<Array<string>>} Array of admin email addresses
   */
  async _getAdminEmails() {
    try {
      // Import here to avoid circular dependency
      const { db } = await import("../../db/index.js");
      const { userTable } = await import("../../db/schema.js");
      const { inArray } = await import("drizzle-orm");

      const admins = await db
        .select({ email: userTable.email })
        .from(userTable)
        .where(inArray(userTable.role, ["admin", "super_admin"]));

      return admins.map((admin) => admin.email).filter(Boolean);
    } catch (error) {
      console.error("Error getting admin emails:", error);
      return [];
    }
  }

  /**
   * Register socket event listeners
   * @param {Object} socket - Socket.IO socket instance
   */
  registerListeners(socket) {
    // Subscribe to all proposals (admin/super_admin only)
    socket.on(PROPOSAL_EVENTS.SUBSCRIBE_ALL_PROPOSALS, () => {
      const userRole = socket.user?.role;

      // Only admins and super_admins can subscribe to all proposals
      if (userRole === "admin" || userRole === "super_admin") {
        socket.join("proposals");
        console.log(`User ${socket.user.id} subscribed to all proposals`);
      } else {
        console.warn(
          `User ${socket.user?.id} (${userRole}) denied access to all proposals`
        );
      }
    });

    // Unsubscribe from all proposals
    socket.on(PROPOSAL_EVENTS.UNSUBSCRIBE_ALL_PROPOSALS, () => {
      socket.leave("proposals");
      console.log(`User ${socket.user?.id} unsubscribed from all proposals`);
    });

    // Subscribe to specific proposal (with authorization)
    socket.on(PROPOSAL_EVENTS.SUBSCRIBE_PROPOSAL, async ({ proposalId }) => {
      try {
        if (!proposalId) {
          console.warn("Proposal subscription attempted without proposalId");
          return;
        }

        const userId = socket.user?.id;
        const userRole = socket.user?.role;
        const isMasterSales = socket.user?.isMasterSales;

        // Fetch proposal to verify access
        const proposal = await proposalService.getProposalById(proposalId);

        // Authorization: admins, super_admins, or the user who created it
        const isAdmin = userRole === "admin" || userRole === "super_admin";
        const isOwner = proposal.requestedBy === userId;
        const canAccess = isAdmin || isOwner || (userRole === "sales" && isMasterSales);

        if (canAccess) {
          socket.join(`proposal:${proposalId}`);
          console.log(`User ${userId} subscribed to proposal ${proposalId}`);
        } else {
          console.warn(
            `User ${userId} (${userRole}) denied access to proposal ${proposalId}`
          );
        }
      } catch (error) {
        console.error(`Error subscribing to proposal ${proposalId}:`, error.message);
      }
    });

    // Unsubscribe from specific proposal
    socket.on(PROPOSAL_EVENTS.UNSUBSCRIBE_PROPOSAL, ({ proposalId }) => {
      socket.leave(`proposal:${proposalId}`);
      console.log(
        `User ${socket.user?.id} unsubscribed from proposal ${proposalId}`
      );
    });
  }
}

export default ProposalEventEmitter;
