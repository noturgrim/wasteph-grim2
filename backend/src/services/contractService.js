import { db } from "../db/index.js";
import {
  contractsTable,
  activityLogTable,
  proposalTable,
  inquiryTable,
  userTable,
} from "../db/schema.js";
import { eq, desc, and, or, like, count } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";
import emailService from "./emailService.js";
import inquiryService from "./inquiryService.js";
import contractTemplateService from "./contractTemplateService.js";
import pdfService from "./pdfService.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * ContractService - Business logic for contract operations
 * Follows: Route → Controller → Service → DB architecture
 */
class ContractService {
  /**
   * Create a new contract (auto-created when proposal is accepted)
   * @param {string} proposalId - Proposal UUID
   * @param {string} userId - User ID (sales user from proposal)
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Created contract
   */
  async createContract(proposalId, userId, metadata = {}) {
    // Check if contract already exists for this proposal
    const [existing] = await db
      .select()
      .from(contractsTable)
      .where(eq(contractsTable.proposalId, proposalId))
      .limit(1);

    if (existing) {
      throw new AppError("Contract already exists for this proposal", 400);
    }

    // Create contract with pending_request status
    const [contract] = await db
      .insert(contractsTable)
      .values({
        proposalId,
        status: "pending_request",
      })
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "contract_created",
      entityType: "contract",
      entityId: contract.id,
      details: { proposalId },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return contract;
  }

  /**
   * Get all contracts with filtering and pagination
   * @param {Object} options - Filter options
   * @param {string} userId - User ID for permission checks
   * @param {string} userRole - User role (admin, sales)
   * @param {boolean} isMasterSales - Is user master sales
   * @returns {Promise<Object>} Contracts with pagination
   */
  async getAllContracts(options = {}, userId, userRole, isMasterSales) {
    const { status, search, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Build base query with joins
    let query = db
      .select({
        contract: contractsTable,
        proposal: proposalTable,
        inquiry: inquiryTable,
        requestedByUser: {
          id: userTable.id,
          email: userTable.email,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          role: userTable.role,
        },
      })
      .from(contractsTable)
      .leftJoin(proposalTable, eq(contractsTable.proposalId, proposalTable.id))
      .leftJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id))
      .leftJoin(userTable, eq(contractsTable.requestedBy, userTable.id));

    // Build filter conditions
    let conditions = [];

    // Permission: Sales can only see their own contracts (unless master sales)
    if (userRole === "sales" && !isMasterSales) {
      conditions.push(eq(proposalTable.requestedBy, userId));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(contractsTable.status, status));
    }

    // Search by client name or email
    if (search) {
      conditions.push(
        or(
          like(inquiryTable.name, `%${search}%`),
          like(inquiryTable.email, `%${search}%`),
          like(inquiryTable.company, `%${search}%`),
        ),
      );
    }

    // Count total records
    const countQuery = db
      .select({ value: count() })
      .from(contractsTable)
      .leftJoin(proposalTable, eq(contractsTable.proposalId, proposalTable.id))
      .leftJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id));

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ value: total }] = await countQuery;

    // Get paginated data
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const contracts = await query
      .orderBy(desc(contractsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: contracts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get contract by ID
   * @param {string} contractId - Contract UUID
   * @returns {Promise<Object>} Contract with related data
   */
  async getContractById(contractId) {
    const [contract] = await db
      .select({
        contract: contractsTable,
        proposal: proposalTable,
        inquiry: inquiryTable,
      })
      .from(contractsTable)
      .leftJoin(proposalTable, eq(contractsTable.proposalId, proposalTable.id))
      .leftJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id))
      .where(eq(contractsTable.id, contractId))
      .limit(1);

    if (!contract) {
      throw new AppError("Contract not found", 404);
    }

    return contract;
  }

  /**
   * Get contract by proposal ID
   * @param {string} proposalId - Proposal UUID
   * @returns {Promise<Object>} Contract
   */
  async getContractByProposalId(proposalId) {
    const [contract] = await db
      .select()
      .from(contractsTable)
      .where(eq(contractsTable.proposalId, proposalId))
      .limit(1);

    return contract || null;
  }

  /**
   * Sales requests contract from admin
   * @param {string} contractId - Contract UUID
   * @param {Object} contractDetails - Contract details from sales
   * @param {string} userId - Sales user ID
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated contract
   */
  async requestContract(contractId, contractDetails, userId, customTemplateBuffer = null, metadata = {}) {
    // Get contract
    const contractData = await this.getContractById(contractId);
    const contract = contractData.contract;

    // Validate status
    if (contract.status !== "pending_request") {
      throw new AppError("Contract has already been requested", 400);
    }

    // Validate ownership (sales can only request their own contracts)
    if (contractData.proposal.requestedBy !== userId) {
      throw new AppError(
        "You can only request contracts for your own proposals",
        403,
      );
    }

    // Save custom template if provided
    let customTemplateUrl = null;
    let templateId = null;

    if (customTemplateBuffer) {
      // Custom template provided - save it
      customTemplateUrl = await this.saveCustomTemplate(customTemplateBuffer, contractId);
    } else {
      // No custom template - use system template
      const { contractType } = contractDetails;
      try {
        const suggestedTemplate = await contractTemplateService.suggestTemplateForContract(contractType);
        templateId = suggestedTemplate.id;
      } catch (error) {
        console.error("Failed to suggest template:", error);
        // Continue without template - admin can upload PDF manually
      }
    }

    // Extract contract details
    const {
      contractType,
      clientName,
      companyName,
      clientEmailContract,
      clientAddress,
      contractDuration,
      serviceLatitude,
      serviceLongitude,
      collectionSchedule,
      collectionScheduleOther,
      wasteAllowance,
      specialClauses,
      signatories,
      ratePerKg,
      clientRequests,
      requestNotes,
    } = contractDetails;

    // Prepare contract data for template rendering (if using template)
    const contractDataForTemplate = {
      contractType,
      clientName,
      companyName,
      clientEmailContract,
      clientAddress,
      contractDuration,
      serviceLatitude,
      serviceLongitude,
      collectionSchedule,
      collectionScheduleOther,
      wasteAllowance,
      specialClauses,
      signatories,
      ratePerKg,
      clientRequests,
    };

    // Update contract with details
    const [updatedContract] = await db
      .update(contractsTable)
      .set({
        status: "requested",
        requestedBy: userId,
        requestedAt: new Date(),
        requestNotes,
        // Contract details
        contractType,
        clientName,
        companyName,
        clientEmailContract,
        clientAddress,
        contractDuration,
        serviceLatitude,
        serviceLongitude,
        collectionSchedule,
        collectionScheduleOther,
        wasteAllowance,
        specialClauses,
        signatories: signatories ? JSON.stringify(signatories) : null,
        ratePerKg,
        clientRequests,
        customTemplateUrl,
        // Template-related fields
        templateId,
        contractData: templateId ? JSON.stringify(contractDataForTemplate) : null,
        updatedAt: new Date(),
      })
      .where(eq(contractsTable.id, contractId))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "contract_requested",
      entityType: "contract",
      entityId: contractId,
      details: { requestNotes, contractType, clientName },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedContract;
  }

  /**
   * Admin uploads contract PDF
   * @param {string} contractId - Contract UUID
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} adminNotes - Optional notes from admin
   * @param {string} userId - Admin user ID
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated contract
   */
  async uploadContractPdf(
    contractId,
    pdfBuffer,
    adminNotes,
    userId,
    editedData = null,
    metadata = {},
  ) {
    // Get contract
    const contractData = await this.getContractById(contractId);
    const contract = contractData.contract;

    // Validate status
    if (
      contract.status !== "requested" &&
      contract.status !== "ready_for_sales"
    ) {
      throw new AppError(
        "Can only upload contract when status is requested or ready_for_sales",
        400,
      );
    }

    // Save PDF file
    const pdfUrl = await this.saveContractPdf(pdfBuffer, contractId);

    // Prepare update object
    const updateData = {
      status: "ready_for_sales",
      contractUploadedBy: userId,
      contractUploadedAt: new Date(),
      contractPdfUrl: pdfUrl,
      adminNotes,
      updatedAt: new Date(),
    };

    // If admin edited contract data, include it in the update
    if (editedData) {
      Object.assign(updateData, {
        contractType: editedData.contractType,
        clientName: editedData.clientName,
        companyName: editedData.companyName,
        clientEmailContract: editedData.clientEmailContract,
        clientAddress: editedData.clientAddress,
        contractDuration: editedData.contractDuration,
        serviceLatitude: editedData.serviceLatitude,
        serviceLongitude: editedData.serviceLongitude,
        collectionSchedule: editedData.collectionSchedule,
        collectionScheduleOther: editedData.collectionScheduleOther,
        wasteAllowance: editedData.wasteAllowance,
        specialClauses: editedData.specialClauses,
        signatories: editedData.signatories ? JSON.stringify(editedData.signatories) : null,
        ratePerKg: editedData.ratePerKg,
        clientRequests: editedData.clientRequests,
      });
    }

    // Update contract
    const [updatedContract] = await db
      .update(contractsTable)
      .set(updateData)
      .where(eq(contractsTable.id, contractId))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "contract_uploaded",
      entityType: "contract",
      entityId: contractId,
      details: { 
        pdfUrl, 
        adminNotes,
        dataEdited: editedData ? true : false,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedContract;
  }

  /**
   * Generate contract from template (admin action)
   * @param {string} contractId - Contract UUID
   * @param {Object} editedData - Edited contract data (optional)
   * @param {string} adminNotes - Admin notes (optional)
   * @param {string} userId - Admin user ID
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated contract with PDF
   */
  async generateContractFromTemplate(
    contractId,
    editedData = null,
    adminNotes = null,
    userId,
    metadata = {}
  ) {
    // Get contract
    const contractData = await this.getContractById(contractId);
    const contract = contractData.contract;

    // Validate status
    if (
      contract.status !== "requested" &&
      contract.status !== "ready_for_sales"
    ) {
      throw new AppError(
        "Can only generate contract when status is requested or ready_for_sales",
        400
      );
    }

    // Validate that contract has a template
    if (!contract.templateId) {
      throw new AppError(
        "Contract does not have a template. Use upload PDF instead.",
        400
      );
    }

    // Get template
    const template = await contractTemplateService.getTemplateById(
      contract.templateId
    );

    // Get contract data - use edited data if provided, otherwise use stored data
    let contractDataForPdf;
    if (editedData) {
      contractDataForPdf = editedData;
    } else {
      // Parse stored contract data
      try {
        contractDataForPdf = JSON.parse(contract.contractData || "{}");
      } catch (error) {
        throw new AppError("Invalid contract data", 400);
      }
    }

    // Add contract number if available
    contractDataForPdf.contractNumber = contractData.proposal.proposalNumber
      ? contractData.proposal.proposalNumber.replace("PROP-", "CONT-")
      : "PENDING";

    // Generate PDF from template
    let pdfBuffer;
    if (contract.editedHtmlContent) {
      // Use pre-rendered HTML if available
      pdfBuffer = await pdfService.generateContractFromHTML(
        contract.editedHtmlContent
      );
    } else {
      // Generate from template
      pdfBuffer = await pdfService.generateContractPDF(
        contractDataForPdf,
        template.htmlTemplate
      );
    }

    // Save PDF
    const pdfUrl = await this.saveContractPdf(pdfBuffer, contractId);

    // Prepare update object
    const updateData = {
      status: "ready_for_sales",
      contractUploadedBy: userId,
      contractUploadedAt: new Date(),
      contractPdfUrl: pdfUrl,
      adminNotes,
      updatedAt: new Date(),
    };

    // If admin edited contract data, update it
    if (editedData) {
      Object.assign(updateData, {
        contractType: editedData.contractType,
        clientName: editedData.clientName,
        companyName: editedData.companyName,
        clientEmailContract: editedData.clientEmailContract,
        clientAddress: editedData.clientAddress,
        contractDuration: editedData.contractDuration,
        serviceLatitude: editedData.serviceLatitude,
        serviceLongitude: editedData.serviceLongitude,
        collectionSchedule: editedData.collectionSchedule,
        collectionScheduleOther: editedData.collectionScheduleOther,
        wasteAllowance: editedData.wasteAllowance,
        specialClauses: editedData.specialClauses,
        signatories: editedData.signatories
          ? JSON.stringify(editedData.signatories)
          : null,
        ratePerKg: editedData.ratePerKg,
        clientRequests: editedData.clientRequests,
        contractData: JSON.stringify(editedData), // Update stored data
      });
    }

    // Update contract
    const [updatedContract] = await db
      .update(contractsTable)
      .set(updateData)
      .where(eq(contractsTable.id, contractId))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "contract_generated_from_template",
      entityType: "contract",
      entityId: contractId,
      details: {
        templateId: template.id,
        templateName: template.name,
        pdfUrl,
        adminNotes,
        dataEdited: editedData ? true : false,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedContract;
  }

  /**
   * Admin sends contract to sales
   * @param {string} contractId - Contract UUID
   * @param {string} userId - Admin user ID
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated contract
   */
  async sendToSales(contractId, userId, metadata = {}) {
    // Get contract
    const contractData = await this.getContractById(contractId);
    const contract = contractData.contract;

    // Validate status
    if (contract.status !== "ready_for_sales") {
      throw new AppError("Can only send to sales when contract is ready", 400);
    }

    // Update contract
    const [updatedContract] = await db
      .update(contractsTable)
      .set({
        status: "sent_to_sales",
        sentToSalesBy: userId,
        sentToSalesAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contractsTable.id, contractId))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "contract_sent_to_sales",
      entityType: "contract",
      entityId: contractId,
      details: {},
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedContract;
  }

  /**
   * Sales sends contract to client
   * @param {string} contractId - Contract UUID
   * @param {string} clientEmail - Client email address
   * @param {string} userId - Sales user ID
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated contract
   */
  async sendToClient(contractId, clientEmail, userId, metadata = {}) {
    // Get contract
    const contractData = await this.getContractById(contractId);
    const contract = contractData.contract;
    const proposal = contractData.proposal;
    const inquiry = contractData.inquiry;

    // Validate status
    if (contract.status !== "sent_to_sales") {
      throw new AppError(
        "Can only send to client after admin sends to sales",
        400,
      );
    }

    // Validate ownership (sales can only send their own contracts)
    if (proposal.requestedBy !== userId) {
      throw new AppError(
        "You can only send contracts for your own proposals",
        403,
      );
    }

    // Validate PDF exists
    if (!contract.contractPdfUrl) {
      throw new AppError("Contract PDF not found", 400);
    }

    // Read PDF file
    const pdfBuffer = await this.getContractPdf(contractId);

    // Parse proposal data
    const proposalData =
      typeof proposal.proposalData === "string"
        ? JSON.parse(proposal.proposalData)
        : proposal.proposalData;

    // Send email with contract PDF
    await emailService.sendContractToClientEmail(
      clientEmail,
      proposalData,
      inquiry,
      pdfBuffer,
    );

    // Update contract
    const [updatedContract] = await db
      .update(contractsTable)
      .set({
        status: "sent_to_client",
        sentToClientBy: userId,
        sentToClientAt: new Date(),
        clientEmail,
        updatedAt: new Date(),
      })
      .where(eq(contractsTable.id, contractId))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "contract_sent_to_client",
      entityType: "contract",
      entityId: contractId,
      details: { clientEmail },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedContract;
  }

  /**
   * Save contract PDF to filesystem
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} contractId - Contract UUID
   * @returns {Promise<string>} PDF file path
   */
  async saveContractPdf(pdfBuffer, contractId) {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, "../../uploads/contracts");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate filename
    const filename = `contract-${contractId}-${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    await fs.writeFile(filepath, pdfBuffer);

    // Return relative path
    return `/uploads/contracts/${filename}`;
  }

  /**
   * Save custom contract template file
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} contractId - Contract UUID
   * @returns {Promise<string>} File URL path
   */
  async saveCustomTemplate(fileBuffer, contractId) {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, "../../uploads/contract-templates");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Determine file extension from buffer (simple check)
    let ext = ".pdf"; // default
    if (fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B) {
      ext = ".docx"; // ZIP-based format (DOCX)
    } else if (fileBuffer[0] === 0xD0 && fileBuffer[1] === 0xCF) {
      ext = ".doc"; // DOC format
    }

    // Generate filename
    const filename = `template-${contractId}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    await fs.writeFile(filepath, fileBuffer);

    // Return relative path
    return `/uploads/contract-templates/${filename}`;
  }

  /**
   * Get contract PDF file
   * @param {string} contractId - Contract UUID
   * @returns {Promise<Buffer>} PDF file buffer
   */
  async getContractPdf(contractId) {
    // Get contract
    const contractData = await this.getContractById(contractId);
    const contract = contractData.contract;

    if (!contract.contractPdfUrl) {
      throw new AppError("Contract PDF not found", 404);
    }

    // Read PDF file
    const filepath = path.join(__dirname, "../..", contract.contractPdfUrl);

    try {
      const pdfBuffer = await fs.readFile(filepath);
      return pdfBuffer;
    } catch (error) {
      throw new AppError("Failed to read contract PDF file", 500);
    }
  }

  /**
   * Log activity for audit trail
   * @param {Object} activityData - Activity data
   */
  async logActivity(activityData) {
    const {
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    } = activityData;

    await db.insert(activityLogTable).values({
      userId,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
    });
  }
}

export default new ContractService();
