import { db } from "../../db/index.js";
import { contractsTable, proposalTable, inquiryTable, userTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import contractService from "../../services/contractService.js";

/**
 * Contract Socket Events
 * Real-time events for contract lifecycle
 */

export const CONTRACT_EVENTS = {
  CONTRACT_REQUESTED: "contract:requested",
  CONTRACT_UPLOADED: "contract:uploaded",
  CONTRACT_SENT_TO_SALES: "contract:sentToSales",
  CONTRACT_SENT_TO_CLIENT: "contract:sentToClient",
  CONTRACT_SIGNED: "contract:signed",
};

class ContractEventEmitter {
  constructor(socketServer) {
    this.socketServer = socketServer;
    this.notificationService = null;
  }

  setNotificationService(notificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Emit when sales requests a contract from admin
   */
  async emitContractRequested(contract, user) {
    try {
      if (!this.socketServer || !this.notificationService) {
        console.warn("Socket server or notification service not initialized");
        return;
      }

      // Get admin user IDs
      const adminIds = await this._getAdminUserIds();

      if (adminIds.length === 0) {
        console.warn("No admin users found to notify");
        return;
      }

      const eventData = {
        contractId: contract.id,
        proposalId: contract.proposalId,
        proposalNumber: contract.proposalNumber,
        status: contract.status,
        contractType: contract.contractType,
        clientName: contract.clientName,
        companyName: contract.companyName,
        inquiryName: contract.inquiryName,
        inquiryCompany: contract.inquiryCompany,
        requestedBy: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        requestedAt: contract.requestedAt,
      };

      // Emit socket event to all admins
      this.socketServer.emitToRoles(
        ["admin", "super_admin"],
        CONTRACT_EVENTS.CONTRACT_REQUESTED,
        eventData
      );

      // Create database notifications for all admins
      await this.notificationService.createBulkNotifications(adminIds, {
        type: "contract_requested",
        title: "New Contract Request",
        message: `${user.firstName} ${user.lastName} requested a contract for ${contract.clientName || contract.inquiryName}`,
        entityType: "contract",
        entityId: contract.id,
        metadata: {
          contractId: contract.id,
          proposalId: contract.proposalId,
          proposalNumber: contract.proposalNumber,
          contractType: contract.contractType,
          clientName: contract.clientName,
          companyName: contract.companyName,
          requestedBy: user.id,
          requestedByName: `${user.firstName} ${user.lastName}`,
        },
      });

      console.log(`✅ Contract requested event emitted for contract ${contract.id}`);
    } catch (error) {
      console.error("Error emitting contract requested event:", error);
    }
  }

  /**
   * Emit when admin uploads/generates contract and sends to sales
   */
  async emitContractSentToSales(contract, admin, salesUser) {
    try {
      if (!this.socketServer || !this.notificationService) {
        console.warn("Socket server or notification service not initialized");
        return;
      }

      const eventData = {
        contractId: contract.id,
        proposalId: contract.proposalId,
        proposalNumber: contract.proposalNumber,
        status: contract.status,
        clientName: contract.clientName,
        companyName: contract.companyName,
        sentToSalesBy: {
          id: admin.id,
          name: `${admin.firstName} ${admin.lastName}`,
          email: admin.email,
        },
        sentToSalesAt: contract.sentToSalesAt,
      };

      // Emit socket event to the sales user
      this.socketServer.emitToUser(
        salesUser.id,
        CONTRACT_EVENTS.CONTRACT_SENT_TO_SALES,
        eventData
      );

      // Create database notification for sales user
      await this.notificationService.createNotification({
        userId: salesUser.id,
        type: "contract_requested", // Using same type since contract_sent_to_sales doesn't exist in enum
        title: "Contract Ready",
        message: `${admin.firstName} ${admin.lastName} has prepared the contract for ${contract.clientName || contract.companyName}`,
        entityType: "contract",
        entityId: contract.id,
        metadata: {
          contractId: contract.id,
          proposalId: contract.proposalId,
          proposalNumber: contract.proposalNumber,
          sentBy: admin.id,
          sentByName: `${admin.firstName} ${admin.lastName}`,
        },
      });

      console.log(`✅ Contract sent to sales event emitted for contract ${contract.id}`);
    } catch (error) {
      console.error("Error emitting contract sent to sales event:", error);
    }
  }

  /**
   * Get all admin user IDs
   */
  async _getAdminUserIds() {
    try {
      const admins = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.role, "admin"))
        .union(
          db
            .select({ id: userTable.id })
            .from(userTable)
            .where(eq(userTable.role, "super_admin"))
        );

      return admins.map((admin) => admin.id);
    } catch (error) {
      console.error("Error fetching admin user IDs:", error);
      return [];
    }
  }

  /**
   * Register socket listeners for contracts
   */
  registerListeners(socket) {
    // Subscribe to all contracts updates (admin/super_admin only)
    socket.on("contracts:subscribe", () => {
      const userRole = socket.user?.role;

      // Only admins and super_admins can subscribe to all contracts
      if (userRole === "admin" || userRole === "super_admin") {
        socket.join("contracts");
        console.log(`User ${socket.user.id} subscribed to all contracts`);
      } else {
        console.warn(
          `User ${socket.user?.id} (${userRole}) denied access to all contracts`
        );
      }
    });

    // Unsubscribe from contracts
    socket.on("contracts:unsubscribe", () => {
      socket.leave("contracts");
      console.log(`User ${socket.user?.id} unsubscribed from contracts`);
    });
  }
}

export default ContractEventEmitter;
