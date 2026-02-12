import { db } from "../db/index.js";
import { proposalTable, activityLogTable, inquiryTable, userTable, serviceTable } from "../db/schema.js";
import { eq, desc, and, or, like, inArray, count, sql } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";
import inquiryService from "./inquiryService.js";
import proposalTemplateService from "./proposalTemplateService.js";
import emailService from "./emailService.js";
import pdfService from "./pdfService.js";
import counterService from "./counterService.js";
import { uploadObject, getObject } from "./s3Service.js";
import crypto from "crypto";
import fileService from "./fileService.js";

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
    const { inquiryId, templateId, serviceSubTypeId, proposalData: data } = proposalData;

    let template;
    let wasTemplateSuggested = false;

    if (templateId) {
      // Template provided — run template fetch + counter in parallel (skip inquiry fetch)
      const [fetchedTemplate, proposalNumber] = await Promise.all([
        proposalTemplateService.getTemplateById(templateId),
        counterService.getNextProposalNumber(),
      ]);
      template = fetchedTemplate;

      // Insert proposal
      const [proposal] = await db
        .insert(proposalTable)
        .values({
          proposalNumber,
          inquiryId,
          templateId: template.id,
          serviceSubTypeId: serviceSubTypeId || null,
          requestedBy: userId,
          proposalData: typeof data === "string" ? data : JSON.stringify(data),
          status: "pending",
          wasTemplateSuggested: false,
        })
        .returning();

      // Fire-and-forget: update inquiry status + log activity
      this._updateInquiryStatus(inquiryId, userId, metadata);
      this._logInBackground({
        userId,
        action: "proposal_created",
        entityType: "proposal",
        entityId: proposal.id,
        details: {
          inquiryId,
          templateId: template.id,
          templateType: template.templateType,
          wasTemplateSuggested: false,
        },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });

      return proposal;
    }

    // No template — need inquiry to auto-suggest template
    const inquiry = await inquiryService.getInquiryById(inquiryId);
    template = await proposalTemplateService.suggestTemplateForInquiry(inquiry);
    wasTemplateSuggested = true;

    const proposalNumber = await counterService.getNextProposalNumber();

    const [proposal] = await db
      .insert(proposalTable)
      .values({
        proposalNumber,
        inquiryId,
        templateId: template.id,
        requestedBy: userId,
        proposalData: typeof data === "string" ? data : JSON.stringify(data),
        status: "pending",
        wasTemplateSuggested,
      })
      .returning();

    // Fire-and-forget: update inquiry status + log activity
    this._updateInquiryStatus(inquiryId, userId, metadata);
    this._logInBackground({
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
   * Create a proposal with a directly uploaded PDF (fallback for when template editor is problematic)
   * @param {Object} data - { inquiryId, serviceSubTypeId, proposalData, pdfBuffer, pdfOriginalName }
   * @param {string} userId - User creating the proposal
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Created proposal
   */
  async createProposalWithUpload(data, userId, metadata = {}) {
    const { inquiryId, serviceSubTypeId, proposalData, pdfBuffer, pdfOriginalName } = data;

    const proposalNumber = await counterService.getNextProposalNumber();

    // Upload PDF to S3 immediately
    const dateFolder = new Date().toISOString().split("T")[0];
    const key = `proposals/${dateFolder}/${proposalNumber}-uploaded.pdf`;
    await uploadObject(key, pdfBuffer, "application/pdf");

    // Build proposalData JSON (client info + metadata, no HTML content)
    const proposalDataJson = {
      ...proposalData,
      isUploadedPdf: true,
      uploadedFileName: pdfOriginalName,
      terms: {
        validityDays: proposalData.validityDays || 30,
      },
    };

    const [proposal] = await db
      .insert(proposalTable)
      .values({
        proposalNumber,
        inquiryId,
        templateId: null,
        serviceSubTypeId: serviceSubTypeId || null,
        requestedBy: userId,
        proposalData: JSON.stringify(proposalDataJson),
        status: "pending",
        isUploadedPdf: true,
        pdfUrl: key,
        wasTemplateSuggested: false,
      })
      .returning();

    // Log file to user_files (fire-and-forget)
    fileService.logFile({
      fileName: pdfOriginalName || `${proposalNumber}.pdf`,
      fileUrl: key,
      fileType: "application/pdf",
      fileSize: pdfBuffer.length,
      entityType: "proposal",
      entityId: proposal.id,
      relatedEntityNumber: proposalNumber,
      clientName: proposalData.clientName || null,
      action: "uploaded",
      uploadedBy: userId,
    });

    // Fire-and-forget: update inquiry status + log activity
    this._updateInquiryStatus(inquiryId, userId, metadata);
    this._logInBackground({
      userId,
      action: "proposal_created",
      entityType: "proposal",
      entityId: proposal.id,
      details: {
        inquiryId,
        isUploadedPdf: true,
        uploadedFileName: pdfOriginalName,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return proposal;
  }

  /**
   * Fire-and-forget: update inquiry status to proposal_created
   */
  _updateInquiryStatus(inquiryId, userId, metadata) {
    db.update(inquiryTable)
      .set({ status: "proposal_created", updatedAt: new Date() })
      .where(eq(inquiryTable.id, inquiryId))
      .catch((err) => console.error("Failed to update inquiry status:", err));
  }

  /**
   * Fire-and-forget activity log
   */
  _logInBackground(activityData) {
    db.insert(activityLogTable)
      .values({
        ...activityData,
        details: activityData.details ? JSON.stringify(activityData.details) : null,
      })
      .catch((err) => console.error("Failed to log activity:", err));
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
    const { status, inquiryId, requestedBy, search, page: rawPage = 1, limit: rawLimit = 10 } = options;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;
    const offset = (page - 1) * limit;

    // Permission filter (applies to both data query and facets)
    const permissionFilter =
      userRole === "sales" && !isMasterSales
        ? sql`requested_by = ${userId}`
        : requestedBy
          ? sql`requested_by = ${requestedBy}`
          : sql`1=1`;

    const conditions = [];

    // Permission check: Regular sales see only their proposals
    if (userRole === "sales" && !isMasterSales) {
      conditions.push(eq(proposalTable.requestedBy, userId));
    }

    // Optional requestedBy filter (used by master sales "My" view)
    if (requestedBy) {
      conditions.push(eq(proposalTable.requestedBy, requestedBy));
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

    // Run data + facets in parallel
    const [rows, facetRows] = await Promise.all([
      // 1. Paginated data + total count via window function
      (() => {
        let query = db
          .select({
            id: proposalTable.id,
            proposalNumber: proposalTable.proposalNumber,
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
            inquiryNumber: inquiryTable.inquiryNumber,
            // Total count via window function
            totalCount: sql`(count(*) over())::int`,
          })
          .from(proposalTable)
          .leftJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id));

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        return query
          .orderBy(desc(proposalTable.createdAt))
          .limit(limit)
          .offset(offset);
      })(),

      // 2. Status facet counts (permission-filtered, but NOT status-filtered)
      db.execute(sql`
        SELECT status::text AS facet_value, count(*)::int AS cnt
        FROM proposal
        WHERE ${permissionFilter}
        GROUP BY status
      `),
    ]);

    const total = rows.length > 0 ? rows[0].totalCount : 0;

    // Strip totalCount from each row
    const proposals = rows.map(({ totalCount, ...rest }) => rest);

    // Parse facet rows into a status counts map
    const facets = { status: {} };
    for (const row of facetRows) {
      if (row.facet_value) {
        facets.status[row.facet_value] = row.cnt;
      }
    }

    return {
      data: proposals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      facets,
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

    // Allow updates to pending or disapproved proposals
    if (existing.status !== "pending" && existing.status !== "disapproved") {
      throw new AppError("Can only update pending or disapproved proposals", 400);
    }

    // If updating a disapproved proposal, reset it to pending and clear rejection fields
    const isDisapprovedProposal = existing.status === "disapproved";

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
        // If it was disapproved, reset to pending and clear rejection data
        ...(isDisapprovedProposal && {
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
      action: isDisapprovedProposal ? "proposal_revised" : "proposal_updated",
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
    // Single query: validate status + update in one shot
    const [updatedProposal] = await db
      .update(proposalTable)
      .set({
        status: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(proposalTable.id, proposalId),
          eq(proposalTable.status, "pending"),
        ),
      )
      .returning();

    if (!updatedProposal) {
      // Distinguish not found vs already reviewed
      const [exists] = await db
        .select({ id: proposalTable.id, status: proposalTable.status })
        .from(proposalTable)
        .where(eq(proposalTable.id, proposalId))
        .limit(1);

      throw new AppError(
        exists ? "Proposal already reviewed" : "Proposal not found",
        exists ? 400 : 404,
      );
    }

    // Fire-and-forget: notify sales + log activity
    this._notifySalesApproval(updatedProposal, metadata);
    this._logInBackground({
      userId: adminId,
      action: "proposal_approved",
      entityType: "proposal",
      entityId: updatedProposal.id,
      details: { inquiryId: updatedProposal.inquiryId },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedProposal;
  }

  /**
   * Fire-and-forget: notify sales person that proposal was approved
   */
  _notifySalesApproval(proposal, metadata) {
    Promise.all([
      db
        .select({ email: userTable.email })
        .from(userTable)
        .where(eq(userTable.id, proposal.requestedBy))
        .limit(1),
      db
        .select({ name: inquiryTable.name })
        .from(inquiryTable)
        .where(eq(inquiryTable.id, proposal.inquiryId))
        .limit(1),
    ])
      .then(([[salesUser], [inquiry]]) => {
        if (salesUser) {
          return emailService.sendNotificationEmail(
            salesUser.email,
            "Proposal Approved - Ready to Send",
            `Your proposal for ${inquiry?.name || "a client"} has been approved. You can now send it to the client.`,
          );
        }
      })
      .catch((err) => console.error("Failed to notify sales:", err));
  }

  /**
   * Send proposal to client - Sales sends approved proposal via email
   * @param {string} proposalId - Proposal UUID
   * @param {string} salesUserId - Sales user sending the proposal
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated proposal
   */
  async sendProposal(proposalId, salesUserId, metadata = {}) {
    // Step 1: Validate + set token in a single UPDATE (checks status + ownership)
    const responseToken = crypto.randomBytes(32).toString("hex");

    const [proposal] = await db
      .update(proposalTable)
      .set({ clientResponseToken: responseToken })
      .where(
        and(
          eq(proposalTable.id, proposalId),
          eq(proposalTable.status, "approved"),
          eq(proposalTable.requestedBy, salesUserId),
        ),
      )
      .returning();

    if (!proposal) {
      // Distinguish error reason
      const [exists] = await db
        .select({
          id: proposalTable.id,
          status: proposalTable.status,
          requestedBy: proposalTable.requestedBy,
        })
        .from(proposalTable)
        .where(eq(proposalTable.id, proposalId))
        .limit(1);

      if (!exists) throw new AppError("Proposal not found", 404);
      if (exists.status !== "approved")
        throw new AppError("Can only send approved proposals", 400);
      throw new AppError(
        "Only the requesting sales person can send this proposal",
        403,
      );
    }

    // Step 2: Fetch inquiry directly (skip proposal sub-query in getInquiryById)
    const [inquiry] = await db
      .select()
      .from(inquiryTable)
      .where(eq(inquiryTable.id, proposal.inquiryId))
      .limit(1);

    if (!inquiry) {
      throw new AppError("Inquiry not found", 404);
    }

    const proposalData = JSON.parse(proposal.proposalData);

    // Step 3: Generate PDF (or use pre-uploaded PDF)
    let pdfBuffer, pdfUrl;
    try {
      if (proposal.isUploadedPdf && proposal.pdfUrl) {
        // Uploaded PDF — use existing file from S3 directly
        pdfBuffer = await this.readPDF(proposal.pdfUrl);
        pdfUrl = proposal.pdfUrl;
      } else {
        let htmlForPdf = null;

        if (proposalData.editedHtmlContent) {
          // Check if saved HTML is complete
          if (this._isCompleteHtml(proposalData.editedHtmlContent)) {
            // Use saved HTML (preferred path - preserves all user edits)
            htmlForPdf = proposalData.editedHtmlContent;
            console.log(`Using editedHtmlContent for PDF generation (proposal ${proposalId})`);
          } else {
            console.warn(
              `editedHtmlContent is incomplete for proposal ${proposalId}, ` +
              `falling back to template re-rendering. This indicates a data quality issue.`
            );
          }
        }

        // Fallback: re-render from template if no valid HTML
        if (!htmlForPdf) {
          const template = await proposalTemplateService.getTemplateById(proposal.templateId);
          pdfBuffer = await pdfService.generateProposalPDF(
            proposalData,
            inquiry,
            template.htmlTemplate
          );
        } else {
          // Generate from saved HTML
          pdfBuffer = await pdfService.generatePDFFromHTML(htmlForPdf);
        }

        pdfUrl = await this.savePDF(pdfBuffer, proposalId);

        // Log file to user_files (fire-and-forget)
        fileService.logFile({
          fileName: `${proposal.proposalNumber}.pdf`,
          fileUrl: pdfUrl,
          fileType: "application/pdf",
          fileSize: pdfBuffer.length,
          entityType: "proposal",
          entityId: proposalId,
          relatedEntityNumber: proposal.proposalNumber,
          clientName: proposalData.clientName || inquiry.name || null,
          action: "generated",
          uploadedBy: salesUserId,
        });
      }
    } catch (error) {
      throw new AppError("PDF generation failed: " + error.message, 500);
    }

    // Step 4: Send email to client
    const recipientEmail = proposalData.clientEmail || inquiry.email;

    try {
      const emailResult = await emailService.sendProposalEmail(
        recipientEmail,
        proposalData,
        inquiry,
        pdfBuffer,
        proposalId,
        responseToken,
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
          pdfUrl,
          updatedAt: new Date(),
        })
        .where(eq(proposalTable.id, proposalId));

      throw new AppError(
        "Email send failed. PDF saved. Please retry or contact support.",
        500,
      );
    }

    // Step 5: Update proposal to sent (optimistic lock prevents double-send)
    const validityDays = proposalData.terms?.validityDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    const [updatedProposal] = await db
      .update(proposalTable)
      .set({
        status: "sent",
        sentBy: salesUserId,
        sentAt: new Date(),
        emailSentAt: new Date(),
        emailStatus: "sent",
        expiresAt,
        pdfUrl,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(proposalTable.id, proposalId),
          eq(proposalTable.status, "approved"),
        ),
      )
      .returning();

    if (!updatedProposal) {
      throw new AppError("Proposal no longer approved or already sent", 400);
    }

    // Fire-and-forget: inquiry status update + activity log
    this._updateInquiryStatusInBackground(
      proposal.inquiryId,
      "submitted_proposal",
      salesUserId,
      metadata,
    );
    this._logInBackground({
      userId: salesUserId,
      action: "proposal_sent",
      entityType: "proposal",
      entityId: proposal.id,
      details: { inquiryId: proposal.inquiryId, clientEmail: recipientEmail },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedProposal;
  }

  /**
   * Fire-and-forget: update inquiry status after proposal action
   */
  _updateInquiryStatusInBackground(inquiryId, status, userId, metadata) {
    db.update(inquiryTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(inquiryTable.id, inquiryId))
      .catch((err) =>
        console.error("Failed to update inquiry status:", err),
      );
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
   * Reject proposal (Admin disapproves)
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
        status: "disapproved",
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
          "Proposal Disapproved",
          `Your proposal has been disapproved. Reason: ${rejectionReason}`
        );
      }
    } catch (error) {
      console.error("Failed to notify sales:", error);
    }

    // Log activity
    await this.logActivity({
      userId: adminId,
      action: "proposal_disapproved",
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
   * Save PDF buffer to S3
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} proposalId - Proposal UUID
   * @returns {Promise<string>} S3 object key
   */
  async savePDF(pdfBuffer, proposalId) {
    const dateFolder = new Date().toISOString().split("T")[0];
    const key = `proposals/${dateFolder}/${proposalId}.pdf`;
    await uploadObject(key, pdfBuffer, "application/pdf");
    return key;
  }

  /**
   * Read PDF from S3
   * @param {string} key - S3 object key
   * @returns {Promise<Buffer>} PDF buffer
   */
  async readPDF(key) {
    try {
      return await getObject(key);
    } catch (error) {
      throw new AppError("PDF file not found in S3", 404);
    }
  }

  /**
   * Generate PDF preview without saving (for frontend preview)
   * @param {string} proposalId - Proposal UUID
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePreviewPDF(proposalOrId) {
    const proposal =
      typeof proposalOrId === "string"
        ? await this.getProposalById(proposalOrId)
        : proposalOrId;

    // Uploaded PDF — read directly from S3
    if (proposal.isUploadedPdf && proposal.pdfUrl) {
      return this.readPDF(proposal.pdfUrl);
    }

    const proposalData = JSON.parse(proposal.proposalData);

    // New format: use the already-rendered HTML directly
    if (proposalData.editedHtmlContent) {
      return pdfService.generatePDFFromHTML(proposalData.editedHtmlContent);
    }

    // Legacy format: fetch inquiry + template in parallel, then render
    const [inquiry, template] = await Promise.all([
      inquiryService.getInquiryById(proposal.inquiryId),
      proposalTemplateService.getTemplateById(proposal.templateId),
    ]);

    return pdfService.generateProposalPDF(
      proposalData,
      inquiry,
      template.htmlTemplate,
    );
  }

  /**
   * Validate client response token
   * @param {string} proposalId - Proposal UUID
   * @param {string} token - Response token from email link
   * @returns {Promise<Object>} Proposal if token is valid
   * @throws {AppError} If token is invalid or proposal not found
   */
  async validateResponseToken(proposalId, token) {
    if (!token) {
      throw new AppError("Missing response token", 400);
    }

    // Fetch proposal fields + service.requiresContract in one query
    const [proposal] = await db
      .select({
        id: proposalTable.id,
        proposalNumber: proposalTable.proposalNumber,
        status: proposalTable.status,
        requestedBy: proposalTable.requestedBy,
        inquiryId: proposalTable.inquiryId,
        clientResponseToken: proposalTable.clientResponseToken,
        clientResponse: proposalTable.clientResponse,
        clientResponseAt: proposalTable.clientResponseAt,
        sentAt: proposalTable.sentAt,
        expiresAt: proposalTable.expiresAt,
        requiresContract: serviceTable.requiresContract,
      })
      .from(proposalTable)
      .innerJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id))
      .leftJoin(serviceTable, eq(inquiryTable.serviceId, serviceTable.id))
      .where(eq(proposalTable.id, proposalId))
      .limit(1);

    if (!proposal) {
      throw new AppError("Proposal not found", 404);
    }

    if (!proposal.clientResponseToken) {
      throw new AppError("This proposal does not have a response token", 400);
    }

    // Timing-safe token comparison to prevent timing attacks
    const tokenBuffer = Buffer.from(token, "utf8");
    const storedBuffer = Buffer.from(proposal.clientResponseToken, "utf8");

    if (
      tokenBuffer.length !== storedBuffer.length ||
      !crypto.timingSafeEqual(tokenBuffer, storedBuffer)
    ) {
      throw new AppError("Invalid response token", 403);
    }

    // Check if already responded
    if (proposal.clientResponse) {
      throw new AppError(
        `This proposal has already been ${proposal.clientResponse}`,
        400,
      );
    }

    // Check if proposal has expired
    if (proposal.expiresAt && new Date() > new Date(proposal.expiresAt)) {
      if (proposal.status === "sent") {
        db.update(proposalTable)
          .set({ status: "expired", updatedAt: new Date() })
          .where(
            and(
              eq(proposalTable.id, proposalId),
              eq(proposalTable.status, "sent"),
            ),
          )
          .catch((err) => console.error("Failed to mark proposal expired:", err));
      }
      throw new AppError(
        "This proposal has expired. Please contact us for an updated quote.",
        410,
      );
    }

    return proposal;
  }

  /**
   * Record client approval via email (atomic: validates status in WHERE clause)
   * @param {string} proposalId - Proposal UUID
   * @param {string} ipAddress - Client IP address
   * @returns {Promise<Object>} Updated proposal
   */
  async recordClientApproval(proposalId, ipAddress) {
    // Atomic update: WHERE ensures proposal is still in "sent" state with no prior response
    const [updatedProposal] = await db
      .update(proposalTable)
      .set({
        status: "accepted",
        clientResponse: "approved",
        clientResponseAt: new Date(),
        clientResponseIp: ipAddress,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(proposalTable.id, proposalId),
          eq(proposalTable.status, "sent"),
        ),
      )
      .returning();

    if (!updatedProposal) {
      throw new AppError("This proposal has already been responded to or is no longer available", 400);
    }

    // Fire-and-forget: log activity
    this._logInBackground({
      userId: updatedProposal.requestedBy,
      action: "proposal_client_approved",
      entityType: "proposal",
      entityId: proposalId,
      details: { clientIp: ipAddress },
      ipAddress,
      userAgent: null,
    });

    // Check if the service requires a contract
    // Single efficient query: proposal -> inquiry -> service
    const [serviceInfo] = await db
      .select({ requiresContract: serviceTable.requiresContract })
      .from(proposalTable)
      .innerJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id))
      .innerJoin(serviceTable, eq(inquiryTable.serviceId, serviceTable.id))
      .where(eq(proposalTable.id, proposalId))
      .limit(1);

    const requiresContract = serviceInfo?.requiresContract ?? true;

    if (requiresContract) {
      this._createContractInBackground(proposalId, updatedProposal.requestedBy, ipAddress);
    } else {
      this._createClientDirectly(proposalId, updatedProposal.requestedBy, ipAddress);
    }

    return updatedProposal;
  }

  /**
   * Fire-and-forget: auto-create contract after client approval
   */
  _createContractInBackground(proposalId, salesUserId, ipAddress) {
    import("./contractService.js")
      .then(({ default: contractService }) =>
        contractService.createContract(proposalId, salesUserId, {
          ipAddress,
          userAgent: null,
        }),
      )
      .catch((err) => console.error("Failed to auto-create contract:", err));
  }

  /**
   * Fire-and-forget: directly create client when contract is not required.
   * Looks up proposal + inquiry data, creates/updates client, and marks inquiry as on_boarded.
   */
  _createClientDirectly(proposalId, salesUserId, ipAddress) {
    (async () => {
      // 1. Fetch proposal with inquiry in one query
      const [row] = await db
        .select({
          proposalData: proposalTable.proposalData,
          inquiryId: inquiryTable.id,
          inquiryName: inquiryTable.name,
          inquiryEmail: inquiryTable.email,
          inquiryPhone: inquiryTable.phone,
          inquiryCompany: inquiryTable.company,
        })
        .from(proposalTable)
        .innerJoin(inquiryTable, eq(proposalTable.inquiryId, inquiryTable.id))
        .where(eq(proposalTable.id, proposalId))
        .limit(1);

      if (!row) return;

      // 2. Parse client info from proposalData JSON (richer than inquiry fields)
      const parsed =
        typeof row.proposalData === "string"
          ? JSON.parse(row.proposalData)
          : row.proposalData;

      const clientEmail = (
        parsed.clientEmail || row.inquiryEmail
      )?.toLowerCase().trim();

      if (!clientEmail) {
        console.error("[_createClientDirectly] No client email found for proposal:", proposalId);
        return;
      }

      // 3. Check for existing client by email + company name (prevent duplicates)
      const { clientTable } = await import("../db/schema.js");
      const companyName = parsed.clientCompany || row.inquiryCompany || "Unknown";
      const [existing] = await db
        .select({ id: clientTable.id })
        .from(clientTable)
        .where(
          and(
            eq(clientTable.email, clientEmail),
            eq(clientTable.companyName, companyName),
          ),
        )
        .limit(1);

      let clientId;
      if (existing) {
        clientId = existing.id;
      } else {
        // 4. Create new client
        const ClientService = (await import("./clientService.js")).default;
        const clientServiceInstance = new ClientService();
        const client = await clientServiceInstance.createClient(
          {
            companyName,
            contactPerson: parsed.clientName || row.inquiryName || "Unknown",
            email: clientEmail,
            phone: parsed.clientPhone || row.inquiryPhone || "",
            address: parsed.clientAddress || "",
            city: "",
            province: "",
            industry: parsed.clientIndustry || "",
          },
          salesUserId,
          { ipAddress },
        );
        clientId = client.id;
      }

      // 5. Update inquiry status to on_boarded
      await db
        .update(inquiryTable)
        .set({ status: "on_boarded", updatedAt: new Date() })
        .where(eq(inquiryTable.id, row.inquiryId));

      // 6. Log activity
      this._logInBackground({
        userId: salesUserId,
        action: "client_created_from_proposal",
        entityType: "client",
        entityId: clientId,
        details: { proposalId, inquiryId: row.inquiryId, skipContract: true },
        ipAddress,
        userAgent: null,
      });
    })().catch((err) =>
      console.error("Failed to create client directly from proposal:", err)
    );
  }

  /**
   * Record client rejection via email (atomic: validates status in WHERE clause)
   * @param {string} proposalId - Proposal UUID
   * @param {string} ipAddress - Client IP address
   * @returns {Promise<Object>} Updated proposal
   */
  async recordClientRejection(proposalId, ipAddress) {
    // Atomic update: WHERE ensures proposal is still in "sent" state
    const [updatedProposal] = await db
      .update(proposalTable)
      .set({
        status: "rejected",
        clientResponse: "rejected",
        clientResponseAt: new Date(),
        clientResponseIp: ipAddress,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(proposalTable.id, proposalId),
          eq(proposalTable.status, "sent"),
        ),
      )
      .returning();

    if (!updatedProposal) {
      throw new AppError("This proposal has already been responded to or is no longer available", 400);
    }

    // Fire-and-forget: log activity
    this._logInBackground({
      userId: updatedProposal.requestedBy,
      action: "proposal_client_rejected",
      entityType: "proposal",
      entityId: proposalId,
      details: { clientIp: ipAddress },
      ipAddress,
      userAgent: null,
    });

    return updatedProposal;
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

  /**
   * Validate that HTML contains required document structure for PDF generation
   * @param {string} html - HTML string to validate
   * @returns {boolean} True if HTML has complete document structure
   * @private
   */
  _isCompleteHtml(html) {
    if (!html || typeof html !== "string") {
      return false;
    }

    const hasDoctype = html.includes("<!DOCTYPE") || html.includes("<!doctype");
    const hasHtml = /<html[^>]*>/i.test(html);
    const hasHead = /<head[^>]*>/i.test(html);
    const hasBody = /<body[^>]*>/i.test(html);

    return hasDoctype && hasHtml && hasHead && hasBody;
  }
}

export default new ProposalService();
