import { db } from "../db/index.js";
import { proposalTable, activityLogTable, inquiryTable } from "../db/schema.js";
import { eq, desc, and, or, like, inArray, count } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";
import inquiryService from "./inquiryService.js";
import proposalTemplateService from "./proposalTemplateService.js";
import emailService from "./emailService.js";
import pdfService from "./pdfService.js";
import fs from "fs/promises";
import path from "path";

/**
 * ProposalService - Business logic for proposal operations
 * Follows: Route → Controller → Service → DB architecture
 */
class ProposalService {
  /**
   * Create a new proposal
   * @param {Object} proposalData - Proposal data
   * @param {string} userId - User creating the proposal
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Created proposal
   */
  async createProposal(proposalData, userId, metadata = {}) {
    const { inquiryId, templateId, proposalData: data } = proposalData;

    // Get inquiry
    const inquiry = await inquiryService.getInquiryById(inquiryId);

    // Determine template - auto-suggest if not provided
    let template;
    let wasTemplateSuggested = false;

    if (templateId) {
      // Template explicitly provided
      template = await proposalTemplateService.getTemplateById(templateId);
      wasTemplateSuggested = false;
    } else {
      // Auto-suggest template based on inquiry service type
      template = await proposalTemplateService.suggestTemplateForInquiry(inquiry);
      wasTemplateSuggested = true;
    }

    // Create proposal
    const [proposal] = await db
      .insert(proposalTable)
      .values({
        inquiryId,
        templateId: template.id,
        requestedBy: userId,
        proposalData: typeof data === "string" ? data : JSON.stringify(data),
        status: "pending",
        wasTemplateSuggested,
      })
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "proposal_created",
      entityType: "proposal",
      entityId: proposal.id,
      details: {
        inquiryId,
        templateId: template.id,
        templateType: template.templateType,
        wasTemplateSuggested,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return proposal;
  }

  /**
   * Get all proposals with filtering and pagination
   * @param {Object} options - Query options
   * @param {string} userId - Current user ID
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @returns {Promise<Object>} Proposals with pagination
   */
  async getAllProposals(options = {}, userId, userRole, isMasterSales) {
    const { status, inquiryId, search, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Select proposal data with joined inquiry details
    let query = db
      .select({
        id: proposalTable.id,
        inquiryId: proposalTable.inquiryId,
        templateId: proposalTable.templateId,
        requestedBy: proposalTable.requestedBy,
        proposalData: proposalTable.proposalData,
        status: proposalTable.status,
        reviewedBy: proposalTable.reviewedBy,
        reviewedAt: proposalTable.reviewedAt,
        adminNotes: proposalTable.adminNotes,
        rejectionReason: proposalTable.rejectionReason,
        emailSentAt: proposalTable.emailSentAt,
        emailStatus: proposalTable.emailStatus,
        pdfUrl: proposalTable.pdfUrl,
        createdAt: proposalTable.createdAt,
        updatedAt: proposalTable.updatedAt,
        // Inquiry details
        inquiryName: inquiryTable.name,
        inquiryEmail: inquiryTable.email,
        inquiryPhone: inquiryTable.phone,
        inquiryCompany: inquiryTable.company,
      })
      .from(proposalTable)
      .leftJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id));

    const conditions = [];

    // Permission check: Regular sales see only their proposals
    if (userRole === "sales" && !isMasterSales) {
      conditions.push(eq(proposalTable.requestedBy, userId));
    }

    // Status filter - support multiple statuses
    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      if (statuses.length === 1) {
        conditions.push(eq(proposalTable.status, statuses[0]));
      } else {
        conditions.push(inArray(proposalTable.status, statuses));
      }
    }

    // Inquiry filter
    if (inquiryId) {
      conditions.push(eq(proposalTable.inquiryId, inquiryId));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    let countQuery = db.select({ value: count() }).from(proposalTable);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ value: total }] = await countQuery;

    // Get proposals with pagination
    const proposals = await query
      .orderBy(desc(proposalTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: proposals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get proposal by ID
   * @param {string} proposalId - Proposal UUID
   * @returns {Promise<Object>} Proposal object
   */
  async getProposalById(proposalId) {
    const [proposal] = await db
      .select()
      .from(proposalTable)
      .where(eq(proposalTable.id, proposalId))
      .limit(1);

    if (!proposal) {
      throw new AppError("Proposal not found", 404);
    }

    return proposal;
  }

  /**
   * Update proposal
   * @param {string} proposalId - Proposal UUID
   * @param {Object} updateData - Fields to update
   * @param {string} userId - User performing the update
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated proposal
   */
  async updateProposal(proposalId, updateData, userId, metadata = {}) {
    const { proposalData, templateId } = updateData;

    // Get existing proposal
    const existing = await this.getProposalById(proposalId);

    // Allow updates to pending or rejected proposals
    if (existing.status !== "pending" && existing.status !== "rejected") {
      throw new AppError("Can only update pending or rejected proposals", 400);
    }

    // If updating a rejected proposal, reset it to pending and clear rejection fields
    const isRejectedProposal = existing.status === "rejected";

    const [proposal] = await db
      .update(proposalTable)
      .set({
        ...(proposalData && {
          proposalData:
            typeof proposalData === "string"
              ? proposalData
              : JSON.stringify(proposalData),
        }),
        ...(templateId && { templateId }),
        // If it was rejected, reset to pending and clear rejection data
        ...(isRejectedProposal && {
          status: "pending",
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(proposalTable.id, proposalId))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: isRejectedProposal ? "proposal_revised" : "proposal_updated",
      entityType: "proposal",
      entityId: proposal.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return proposal;
  }

  /**
   * Approve proposal - Admin approves proposal (does NOT send email)
   * @param {string} proposalId - Proposal UUID
   * @param {string} adminId - Admin approving
   * @param {string} adminNotes - Admin notes
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated proposal
   */
  async approveProposal(proposalId, adminId, adminNotes, metadata = {}) {
    // Step 1: Validate proposal is pending
    const proposal = await this.getProposalById(proposalId);

    if (proposal.status !== "pending") {
      throw new AppError("Proposal already reviewed", 400);
    }

    // Step 2: Update proposal to approved (NO email sending, NO PDF generation)
    const [updatedProposal] = await db
      .update(proposalTable)
      .set({
        status: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(proposalTable.id, proposalId))
      .returning();

    // Step 3: Notify sales person that proposal is approved (non-critical)
    try {
      const { userTable } = await import("../db/schema.js");
      const [salesUser] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, proposal.requestedBy))
        .limit(1);

      if (salesUser) {
        const inquiry = await inquiryService.getInquiryById(proposal.inquiryId);
        await emailService.sendNotificationEmail(
          salesUser.email,
          "Proposal Approved - Ready to Send",
          `Your proposal for ${inquiry.name} has been approved. You can now send it to the client.`
        );
      }
    } catch (error) {
      console.error("Failed to notify sales:", error);
      // Don't throw - notification failure shouldn't fail approval
    }

    // Step 4: Log activity
    await this.logActivity({
      userId: adminId,
      action: "proposal_approved",
      entityType: "proposal",
      entityId: proposal.id,
      details: { inquiryId: proposal.inquiryId },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedProposal;
  }

  /**
   * Send proposal to client - Sales sends approved proposal via email
   * @param {string} proposalId - Proposal UUID
   * @param {string} salesUserId - Sales user sending the proposal
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated proposal
   */
  async sendProposal(proposalId, salesUserId, metadata = {}) {
    // Step 1: Validate proposal is approved
    const proposal = await this.getProposalById(proposalId);

    if (proposal.status !== "approved") {
      throw new AppError("Can only send approved proposals", 400);
    }

    // Step 2: Validate sales user is the one who requested it
    if (proposal.requestedBy !== salesUserId) {
      throw new AppError("Only the requesting sales person can send this proposal", 403);
    }

    // Step 3: Get inquiry and template
    const inquiry = await inquiryService.getInquiryById(proposal.inquiryId);
    const template = await proposalTemplateService.getTemplateById(
      proposal.templateId
    );

    // Step 4: Generate PDF
    let pdfBuffer, pdfUrl;
    try {
      pdfBuffer = await pdfService.generateProposalPDF(
        JSON.parse(proposal.proposalData),
        inquiry,
        template.htmlTemplate
      );
      pdfUrl = await this.savePDF(pdfBuffer, proposalId);
    } catch (error) {
      throw new AppError("PDF generation failed: " + error.message, 500);
    }

    // Step 5: Send email to client
    try {
      const emailResult = await emailService.sendProposalEmail(
        inquiry.email,
        JSON.parse(proposal.proposalData),
        inquiry,
        pdfBuffer
      );

      if (!emailResult.success) {
        throw new Error(emailResult.error || "Email send failed");
      }
    } catch (error) {
      // Email failed - Save PDF but mark email as failed
      await db
        .update(proposalTable)
        .set({
          emailStatus: "failed",
          pdfUrl, // Save PDF for retry
          updatedAt: new Date(),
        })
        .where(eq(proposalTable.id, proposalId));

      throw new AppError(
        "Email send failed. PDF saved. Please retry or contact support.",
        500
      );
    }

    // Step 6: Update proposal to sent (with optimistic locking to prevent race conditions)
    const [updatedProposal] = await db
      .update(proposalTable)
      .set({
        status: "sent",
        sentBy: salesUserId,
        sentAt: new Date(),
        emailSentAt: new Date(),
        emailStatus: "sent",
        pdfUrl,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(proposalTable.id, proposalId),
          eq(proposalTable.status, "approved") // Ensure still approved (prevents double-send)
        )
      )
      .returning();

    // If no rows updated, proposal was already sent or status changed
    if (!updatedProposal) {
      throw new AppError("Proposal no longer approved or already sent", 400);
    }

    // Step 7: Update inquiry status (non-critical, log errors but don't fail)
    try {
      await inquiryService.updateInquiry(
        proposal.inquiryId,
        { status: "submitted_proposal" },
        salesUserId,
        metadata
      );
    } catch (error) {
      console.error("Failed to update inquiry status after sending proposal:", error);
      // Don't throw - proposal is already sent, inquiry update failure shouldn't rollback
    }

    // Step 8: Log activity
    await this.logActivity({
      userId: salesUserId,
      action: "proposal_sent",
      entityType: "proposal",
      entityId: proposal.id,
      details: { inquiryId: proposal.inquiryId, clientEmail: inquiry.email },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedProposal;
  }

  /**
   * Retry email send for failed proposals
   * @param {string} proposalId - Proposal UUID
   * @param {string} adminId - Admin retrying
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Success response
   */
  async retryProposalEmail(proposalId, adminId, metadata = {}) {
    const proposal = await this.getProposalById(proposalId);

    // Only retry if status is pending with failed email, OR approved but email failed
    const canRetry =
      (proposal.status === "pending" && proposal.emailStatus === "failed") ||
      (proposal.status === "approved" && proposal.emailStatus === "failed");

    if (!canRetry || proposal.emailStatus === "sent") {
      throw new AppError(
        "Can only retry failed email sends for proposals",
        400
      );
    }

    if (!proposal.pdfUrl) {
      throw new AppError("PDF not found. Please re-approve proposal.", 400);
    }

    const inquiry = await inquiryService.getInquiryById(proposal.inquiryId);

    // Read PDF from storage
    const pdfBuffer = await this.readPDF(proposal.pdfUrl);

    // Retry email send
    const emailResult = await emailService.sendProposalEmail(
      inquiry.email,
      JSON.parse(proposal.proposalData),
      inquiry,
      pdfBuffer
    );

    if (!emailResult.success) {
      throw new AppError("Email retry failed: " + emailResult.error, 500);
    }

    // Update email status
    await db
      .update(proposalTable)
      .set({
        emailSentAt: new Date(),
        emailStatus: "sent",
        updatedAt: new Date(),
      })
      .where(eq(proposalTable.id, proposalId));

    await this.logActivity({
      userId: adminId,
      action: "proposal_email_retried",
      entityType: "proposal",
      entityId: proposal.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return { success: true };
  }

  /**
   * Reject proposal
   * @param {string} proposalId - Proposal UUID
   * @param {string} adminId - Admin rejecting
   * @param {string} rejectionReason - Reason for rejection
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated proposal
   */
  async rejectProposal(proposalId, adminId, rejectionReason, metadata = {}) {
    const proposal = await this.getProposalById(proposalId);

    if (proposal.status !== "pending") {
      throw new AppError("Proposal already reviewed", 400);
    }

    const [updatedProposal] = await db
      .update(proposalTable)
      .set({
        status: "rejected",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(proposalTable.id, proposalId))
      .returning();

    // Notify sales person
    try {
      const { userTable } = await import("../db/schema.js");
      const [salesUser] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, proposal.requestedBy))
        .limit(1);

      if (salesUser) {
        await emailService.sendNotificationEmail(
          salesUser.email,
          "Proposal Rejected",
          `Your proposal has been rejected. Reason: ${rejectionReason}`
        );
      }
    } catch (error) {
      console.error("Failed to notify sales:", error);
    }

    // Log activity
    await this.logActivity({
      userId: adminId,
      action: "proposal_rejected",
      entityType: "proposal",
      entityId: proposal.id,
      details: { rejectionReason },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedProposal;
  }

  /**
   * Cancel proposal (by sales person)
   * @param {string} proposalId - Proposal UUID
   * @param {string} userId - User cancelling
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated proposal
   */
  async cancelProposal(proposalId, userId, metadata = {}) {
    const proposal = await this.getProposalById(proposalId);

    if (proposal.status !== "pending") {
      throw new AppError("Can only cancel pending proposals", 400);
    }

    // Only requestedBy user can cancel
    if (proposal.requestedBy !== userId) {
      throw new AppError("Only the requester can cancel this proposal", 403);
    }

    const [updatedProposal] = await db
      .update(proposalTable)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(proposalTable.id, proposalId))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "proposal_cancelled",
      entityType: "proposal",
      entityId: proposal.id,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedProposal;
  }

  /**
   * Save PDF buffer to file system
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} proposalId - Proposal UUID
   * @returns {Promise<string>} File path
   */
  async savePDF(pdfBuffer, proposalId) {
    const storagePath =
      process.env.PDF_STORAGE_PATH || "./storage/proposals";
    const fileName = `${proposalId}.pdf`;
    const filePath = path.join(storagePath, fileName);

    // Ensure directory exists
    await fs.mkdir(storagePath, { recursive: true });

    // Write PDF to file
    await fs.writeFile(filePath, pdfBuffer);

    return filePath;
  }

  /**
   * Read PDF from file system
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<Buffer>} PDF buffer
   */
  async readPDF(pdfPath) {
    try {
      return await fs.readFile(pdfPath);
    } catch (error) {
      throw new AppError("PDF file not found", 404);
    }
  }

  /**
   * Generate PDF preview without saving (for frontend preview)
   * @param {string} proposalId - Proposal UUID
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePreviewPDF(proposalId) {
    const proposal = await this.getProposalById(proposalId);
    const inquiry = await inquiryService.getInquiryById(proposal.inquiryId);
    const template = await proposalTemplateService.getTemplateById(
      proposal.templateId
    );

    // Generate PDF (don't save)
    const pdfBuffer = await pdfService.generateProposalPDF(
      JSON.parse(proposal.proposalData),
      inquiry,
      template.htmlTemplate
    );

    return pdfBuffer;
  }

  /**
   * Log activity to activity log table
   * @param {Object} activityData - Activity log data
   * @returns {Promise<void>}
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

export default new ProposalService();
