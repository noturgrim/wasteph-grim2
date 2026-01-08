import proposalService from "../services/proposalService.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * ProposalController - Handle HTTP requests for proposal operations
 * Route → Controller → Service → DB architecture
 */

/**
 * Create a new proposal
 * POST /api/proposals
 */
export const createProposal = async (req, res, next) => {
  try {
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const proposal = await proposalService.createProposal(
      req.body,
      req.user.id,
      metadata
    );

    res.status(201).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all proposals with filtering and pagination
 * GET /api/proposals
 */
export const getAllProposals = async (req, res, next) => {
  try {
    const { status, inquiryId, search, page, limit } = req.query;

    const result = await proposalService.getAllProposals(
      { status, inquiryId, search, page, limit },
      req.user.id,
      req.user.role,
      req.user.isMasterSales
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get proposal by ID
 * GET /api/proposals/:id
 */
export const getProposalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const proposal = await proposalService.getProposalById(id);

    // Permission check: sales can only see their own proposals
    if (
      req.user.role === "sales" &&
      !req.user.isMasterSales &&
      proposal.requestedBy !== req.user.id
    ) {
      throw new AppError("Access denied", 403);
    }

    res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update proposal
 * PUT /api/proposals/:id
 */
export const updateProposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    // Check if user has permission to update
    const existing = await proposalService.getProposalById(id);
    if (
      req.user.role === "sales" &&
      !req.user.isMasterSales &&
      existing.requestedBy !== req.user.id
    ) {
      throw new AppError("Access denied", 403);
    }

    const proposal = await proposalService.updateProposal(
      id,
      req.body,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve proposal - ADMIN ONLY
 * POST /api/proposals/:id/approve
 */
export const approveProposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    // Admin-only check
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can approve proposals", 403);
    }

    const proposal = await proposalService.approveProposal(
      id,
      req.user.id,
      adminNotes,
      metadata
    );

    res.status(200).json({
      success: true,
      data: proposal,
      message: "Proposal approved successfully. Sales can now send it to the client.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject proposal - ADMIN ONLY
 * POST /api/proposals/:id/reject
 */
export const rejectProposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    // Admin-only check
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can reject proposals", 403);
    }

    if (!rejectionReason || rejectionReason.trim() === "") {
      throw new AppError("Rejection reason is required", 400);
    }

    const proposal = await proposalService.rejectProposal(
      id,
      req.user.id,
      rejectionReason,
      metadata
    );

    res.status(200).json({
      success: true,
      data: proposal,
      message: "Proposal rejected",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send proposal to client - SALES ONLY (own proposals)
 * POST /api/proposals/:id/send
 */
export const sendProposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    // Only sales can send proposals
    if (req.user.role !== "sales") {
      throw new AppError("Only sales users can send proposals", 403);
    }

    const proposal = await proposalService.sendProposal(
      id,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      data: proposal,
      message: "Proposal sent to client successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel proposal - SALES ONLY (own proposals)
 * POST /api/proposals/:id/cancel
 */
export const cancelProposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const proposal = await proposalService.cancelProposal(
      id,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      data: proposal,
      message: "Proposal cancelled",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retry email send for failed proposals - ADMIN ONLY
 * POST /api/proposals/:id/retry-email
 */
export const retryProposalEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    // Admin-only check
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can retry email sends", 403);
    }

    const result = await proposalService.retryProposalEmail(
      id,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download proposal PDF
 * GET /api/proposals/:id/pdf
 */
export const downloadProposalPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const proposal = await proposalService.getProposalById(id);

    // Permission check
    if (
      req.user.role === "sales" &&
      !req.user.isMasterSales &&
      proposal.requestedBy !== req.user.id
    ) {
      throw new AppError("Access denied", 403);
    }

    if (!proposal.pdfUrl) {
      throw new AppError("PDF not found for this proposal", 404);
    }

    // Read PDF buffer
    const pdfBuffer = await proposalService.readPDF(proposal.pdfUrl);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="WastePH_Proposal_${id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Preview proposal PDF without saving
 * POST /api/proposals/:id/preview-pdf
 */
export const previewProposalPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const proposal = await proposalService.getProposalById(id);

    // Permission check - only creator can preview
    if (
      req.user.role === "sales" &&
      !req.user.isMasterSales &&
      proposal.requestedBy !== req.user.id
    ) {
      throw new AppError("Access denied", 403);
    }

    // Generate PDF on-the-fly (don't save)
    const pdfBuffer = await proposalService.generatePreviewPDF(id);

    // Return PDF as base64 for frontend display
    const base64PDF = pdfBuffer.toString("base64");

    res.json({
      success: true,
      data: {
        pdfBase64: base64PDF,
        contentType: "application/pdf",
      },
    });
  } catch (error) {
    next(error);
  }
};