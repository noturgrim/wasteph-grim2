import contractService from "./contractService.js";
import ContractEventEmitter from "../socket/events/contractEvents.js";
import emailService from "./emailService.js";

/**
 * ContractServiceWithSocket
 * Wraps contractService to add real-time socket emissions
 * Follows the same pattern as proposalServiceWithSocket
 */
class ContractServiceWithSocket {
  constructor() {
    this.contractService = contractService;
    this.contractEvents = null;
  }

  initializeSocket(socketServer) {
    this.contractEvents = new ContractEventEmitter(socketServer);
    console.log("✅ Contract socket events initialized");
  }

  setNotificationService(notificationService) {
    if (this.contractEvents) {
      this.contractEvents.setNotificationService(notificationService);
    }
  }

  /**
   * Sales requests contract from admin (with socket emission)
   */
  async requestContract(
    contractId,
    contractDetails,
    userId,
    customTemplateBuffer = null,
    metadata = {}
  ) {
    // Call core service
    const contract = await this.contractService.requestContract(
      contractId,
      contractDetails,
      userId,
      customTemplateBuffer,
      metadata
    );

    // Emit socket event
    if (this.contractEvents && contract?.id) {
      try {
        // Get full contract details with joined data
        const { db } = await import("../db/index.js");
        const { contractsTable, proposalTable, inquiryTable, userTable } =
          await import("../db/schema.js");
        const { eq } = await import("drizzle-orm");

        const [fullContract] = await db
          .select({
            id: contractsTable.id,
            proposalId: contractsTable.proposalId,
            status: contractsTable.status,
            contractType: contractsTable.contractType,
            clientName: contractsTable.clientName,
            companyName: contractsTable.companyName,
            requestedAt: contractsTable.requestedAt,
            // Proposal data
            proposalNumber: proposalTable.proposalNumber,
            // Inquiry data
            inquiryName: inquiryTable.name,
            inquiryCompany: inquiryTable.company,
          })
          .from(contractsTable)
          .leftJoin(
            proposalTable,
            eq(contractsTable.proposalId, proposalTable.id)
          )
          .leftJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id))
          .where(eq(contractsTable.id, contract.id))
          .limit(1);

        // Get user details
        const [user] = await db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            email: userTable.email,
            role: userTable.role,
          })
          .from(userTable)
          .where(eq(userTable.id, userId));

        if (fullContract && user) {
          await this.contractEvents.emitContractRequested(fullContract, user);
        } else {
          console.warn(
            "Could not emit contract requested event: missing contract or user data"
          );
        }
      } catch (error) {
        console.error("Error emitting contract requested event:", error);
      }
    }

    return contract;
  }

  /**
   * Admin uploads contract PDF (with socket emission)
   */
  async uploadContractPdf(
    contractId,
    pdfBuffer,
    adminNotes,
    userId,
    editedData = null,
    metadata = {}
  ) {
    // Call core service
    const contract = await this.contractService.uploadContractPdf(
      contractId,
      pdfBuffer,
      adminNotes,
      userId,
      editedData,
      metadata
    );

    // Emit socket event (contract sent to sales)
    if (this.contractEvents && contract?.id) {
      try {
        const { db } = await import("../db/index.js");
        const { contractsTable, proposalTable, userTable } = await import(
          "../db/schema.js"
        );
        const { eq } = await import("drizzle-orm");

        // Get full contract details
        const [fullContract] = await db
          .select({
            id: contractsTable.id,
            proposalId: contractsTable.proposalId,
            status: contractsTable.status,
            clientName: contractsTable.clientName,
            companyName: contractsTable.companyName,
            sentToSalesAt: contractsTable.sentToSalesAt,
            proposalNumber: proposalTable.proposalNumber,
            requestedBy: proposalTable.requestedBy,
          })
          .from(contractsTable)
          .leftJoin(
            proposalTable,
            eq(contractsTable.proposalId, proposalTable.id)
          )
          .where(eq(contractsTable.id, contract.id))
          .limit(1);

        // Get admin user details
        const [admin] = await db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            email: userTable.email,
          })
          .from(userTable)
          .where(eq(userTable.id, userId));

        // Get sales user details
        const [salesUser] = await db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            email: userTable.email,
          })
          .from(userTable)
          .where(eq(userTable.id, fullContract.requestedBy));

        if (fullContract && admin && salesUser) {
          await this.contractEvents.emitContractSentToSales(
            fullContract,
            admin,
            salesUser
          );
        } else {
          console.warn(
            "Could not emit contract sent to sales event: missing data"
          );
        }
      } catch (error) {
        console.error("Error emitting contract sent to sales event:", error);
      }
    }

    return contract;
  }

  /**
   * Admin generates contract from template (with socket emission)
   */
  async generateContractFromTemplate(
    contractId,
    editedData = null,
    adminNotes = null,
    editedHtmlContent = null,
    userId,
    metadata = {}
  ) {
    // Call core service
    const contract = await this.contractService.generateContractFromTemplate(
      contractId,
      editedData,
      adminNotes,
      editedHtmlContent,
      userId,
      metadata
    );

    // Emit socket event (contract sent to sales)
    if (this.contractEvents && contract?.id) {
      try {
        const { db } = await import("../db/index.js");
        const { contractsTable, proposalTable, userTable } = await import(
          "../db/schema.js"
        );
        const { eq } = await import("drizzle-orm");

        // Get full contract details
        const [fullContract] = await db
          .select({
            id: contractsTable.id,
            proposalId: contractsTable.proposalId,
            status: contractsTable.status,
            clientName: contractsTable.clientName,
            companyName: contractsTable.companyName,
            sentToSalesAt: contractsTable.sentToSalesAt,
            proposalNumber: proposalTable.proposalNumber,
            requestedBy: proposalTable.requestedBy,
          })
          .from(contractsTable)
          .leftJoin(
            proposalTable,
            eq(contractsTable.proposalId, proposalTable.id)
          )
          .where(eq(contractsTable.id, contract.id))
          .limit(1);

        // Get admin user details
        const [admin] = await db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            email: userTable.email,
          })
          .from(userTable)
          .where(eq(userTable.id, userId));

        // Get sales user details
        const [salesUser] = await db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            email: userTable.email,
          })
          .from(userTable)
          .where(eq(userTable.id, fullContract.requestedBy));

        if (fullContract && admin && salesUser) {
          await this.contractEvents.emitContractSentToSales(
            fullContract,
            admin,
            salesUser
          );
        } else {
          console.warn(
            "Could not emit contract sent to sales event: missing data"
          );
        }
      } catch (error) {
        console.error("Error emitting contract sent to sales event:", error);
      }
    }

    return contract;
  }

  // Proxy methods for all other contractService methods (no socket emission needed)
  async createContract(proposalId, userId, metadata = {}) {
    return this.contractService.createContract(proposalId, userId, metadata);
  }

  async getAllContracts(options = {}, userId, userRole, isMasterSales) {
    return this.contractService.getAllContracts(
      options,
      userId,
      userRole,
      isMasterSales
    );
  }

  async getContractById(contractId) {
    return this.contractService.getContractById(contractId);
  }

  async getContractByProposalId(proposalId) {
    return this.contractService.getContractByProposalId(proposalId);
  }

  async saveEditedHtml(contractId, editedHtmlContent, userId, metadata = {}) {
    return this.contractService.saveEditedHtml(
      contractId,
      editedHtmlContent,
      userId,
      metadata
    );
  }

  async sendToClient(contractId, clientEmail, userId, metadata = {}) {
    return this.contractService.sendToClient(
      contractId,
      clientEmail,
      userId,
      metadata
    );
  }

  async saveContractPdf(pdfBuffer, contractId) {
    return this.contractService.saveContractPdf(pdfBuffer, contractId);
  }

  async saveCustomTemplate(fileBuffer, contractId) {
    return this.contractService.saveCustomTemplate(fileBuffer, contractId);
  }

  async getContractPdf(contractId) {
    return this.contractService.getContractPdf(contractId);
  }

  async validateSubmissionToken(contractId, token) {
    return this.contractService.validateSubmissionToken(contractId, token);
  }

  async recordClientSigning(contractId, signedUrl, ip, fileSize = null) {
    // Call core service
    const contract = await this.contractService.recordClientSigning(
      contractId,
      signedUrl,
      ip,
      fileSize
    );

    // Emit socket event
    if (this.contractEvents && contract?.id) {
      try {
        const { db } = await import("../db/index.js");
        const { contractsTable, proposalTable, userTable } = await import(
          "../db/schema.js"
        );
        const { eq, or } = await import("drizzle-orm");

        // Get full contract details
        const [fullContract] = await db
          .select({
            id: contractsTable.id,
            proposalId: contractsTable.proposalId,
            status: contractsTable.status,
            clientName: contractsTable.clientName,
            companyName: contractsTable.companyName,
            signedAt: contractsTable.signedAt,
            clientId: contractsTable.clientId,
            proposalNumber: proposalTable.proposalNumber,
            requestedBy: proposalTable.requestedBy,
            sentToClientBy: contractsTable.sentToClientBy,
            contractNumber: contractsTable.contractNumber,
            clientEmail: contractsTable.clientEmail,
            address: contractsTable.address,
            contractStartDate: contractsTable.contractStartDate,
            contractEndDate: contractsTable.contractEndDate,
          })
          .from(contractsTable)
          .leftJoin(
            proposalTable,
            eq(contractsTable.proposalId, proposalTable.id)
          )
          .where(eq(contractsTable.id, contract.id))
          .limit(1);

        if (fullContract) {
          // Get all admin user IDs
          const admins = await db
            .select({ id: userTable.id })
            .from(userTable)
            .where(
              or(eq(userTable.role, "admin"), eq(userTable.role, "super_admin"))
            );

          const adminIds = admins.map((admin) => admin.id);

          // Also notify the sales user who sent it to client
          const salesUserId =
            fullContract.sentToClientBy || fullContract.requestedBy;
          const notifyUserIds = salesUserId
            ? [...adminIds, salesUserId]
            : adminIds;

          // Remove duplicates
          const uniqueUserIds = [...new Set(notifyUserIds)];

          // Emit socket event to admins and sales user
          const eventData = {
            contractId: fullContract.id,
            proposalId: fullContract.proposalId,
            proposalNumber: fullContract.proposalNumber,
            status: fullContract.status,
            clientName: fullContract.clientName,
            companyName: fullContract.companyName,
            signedAt: fullContract.signedAt,
            clientId: fullContract.clientId,
          };

          // Emit to all relevant users
          uniqueUserIds.forEach((userId) => {
            this.contractEvents.socketServer.emitToUser(
              userId,
              "contract:signed",
              eventData
            );
          });

          // Create database notifications for all users
          await this.contractEvents.notificationService.createBulkNotifications(
            uniqueUserIds,
            {
              type: "contract_signed",
              title: "Contract Signed",
              message: `Client has signed the contract for ${
                fullContract.clientName || fullContract.companyName
              }`,
              entityType: "contract",
              entityId: fullContract.id,
              metadata: {
                contractId: fullContract.id,
                proposalId: fullContract.proposalId,
                proposalNumber: fullContract.proposalNumber,
                clientName: fullContract.clientName,
                companyName: fullContract.companyName,
                clientId: fullContract.clientId,
              },
            }
          );

          // Send email notification to sales person
          if (salesUserId) {
            const [salesUser] = await db
              .select({ email: userTable.email })
              .from(userTable)
              .where(eq(userTable.id, salesUserId))
              .limit(1);

            if (salesUser?.email) {
              const emailData = {
                clientName: fullContract.clientName,
                contractNumber: fullContract.contractNumber,
                companyName: fullContract.companyName,
                clientEmail: fullContract.clientEmail,
                address: fullContract.address,
                contractStartDate: fullContract.contractStartDate,
                contractEndDate: fullContract.contractEndDate,
              };

              emailService
                .sendContractSignedNotification(salesUser.email, emailData)
                .catch((err) =>
                  console.error(
                    `Failed to send contract signed email to ${salesUser.email}:`,
                    err.message
                  )
                );
            }
          }

          console.log(
            `✅ Contract signed event emitted for contract ${fullContract.id}`
          );
        } else {
          console.warn(
            "Could not emit contract signed event: missing contract data"
          );
        }
      } catch (error) {
        console.error("Error emitting contract signed event:", error);
      }
    }

    return contract;
  }

  async uploadHardboundContract(contractId, hardboundUrl, userId, fileSize = null) {
    return this.contractService.uploadHardboundContract(
      contractId,
      hardboundUrl,
      userId,
      fileSize
    );
  }

  async logActivity(activityData) {
    return this.contractService.logActivity(activityData);
  }
}

export default new ContractServiceWithSocket();
