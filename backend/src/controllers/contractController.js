import contractService from "../services/contractService.js";
import { getObject, uploadObject } from "../services/s3Service.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * ContractController - Handle HTTP requests for contract operations
 * Route → Controller → Service → DB architecture
 */

/**
 * Get all contracts with filtering and pagination
 * GET /api/contracts
 */
export const getAllContracts = async (req, res, next) => {
  try {
    const { status, search, page, limit } = req.query;

    const result = await contractService.getAllContracts(
      { status, search, page, limit },
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
 * Get contract by ID
 * GET /api/contracts/:id
 */
export const getContractById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contractData = await contractService.getContractById(id);

    // Permission check: sales can only see their own contracts
    if (
      req.user.role === "sales" &&
      !req.user.isMasterSales &&
      contractData.proposal.requestedBy !== req.user.id
    ) {
      throw new AppError("Access denied", 403);
    }

    res.status(200).json({
      success: true,
      data: contractData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sales requests contract from admin
 * POST /api/contracts/:id/request
 */
export const requestContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contractDetails = req.body; // All contract details from form
    const customTemplateFile = req.file; // Optional custom template file

    // Only sales (or super_admin) can request contracts
    if (req.user.role !== "sales" && req.user.role !== "super_admin") {
      throw new AppError("Only sales users can request contracts", 403);
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const contract = await contractService.requestContract(
      id,
      contractDetails,
      req.user.id,
      customTemplateFile ? customTemplateFile.buffer : null,
      metadata
    );

    res.status(200).json({
      success: true,
      data: contract,
      message: "Contract requested successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin uploads contract PDF
 * POST /api/contracts/:id/upload-pdf
 */
export const uploadContractPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes, editedData } = req.body;

    // Only admin can upload contracts
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      throw new AppError("Only admins can upload contracts", 403);
    }

    // Check if file was uploaded
    if (!req.file) {
      throw new AppError("Please upload a PDF file", 400);
    }

    // Parse editedData if it's a string
    let parsedEditedData = null;
    if (editedData) {
      try {
        parsedEditedData = typeof editedData === 'string' ? JSON.parse(editedData) : editedData;
      } catch (e) {
        console.error("Failed to parse editedData:", e);
      }
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const contract = await contractService.uploadContractPdf(
      id,
      req.file.buffer,
      adminNotes,
      req.user.id,
      parsedEditedData,
      metadata
    );

    res.status(200).json({
      success: true,
      data: contract,
      message: "Contract uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate contract from template (admin)
 * POST /api/contracts/:id/generate-from-template
 */
export const generateContractFromTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { editedData, adminNotes, editedHtmlContent } = req.body;

    // Only admin can generate contracts
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      throw new AppError("Only admins can generate contracts", 403);
    }

    // Parse editedData if it's a string
    let parsedEditedData = null;
    if (editedData) {
      try {
        parsedEditedData = typeof editedData === 'string' ? JSON.parse(editedData) : editedData;
      } catch (e) {
        console.error("Failed to parse editedData:", e);
      }
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const contract = await contractService.generateContractFromTemplate(
      id,
      parsedEditedData,
      adminNotes,
      editedHtmlContent || null,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      data: contract,
      message: "Contract generated from template successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save edited HTML content without submitting (admin)
 * PUT /api/contracts/:id/save-edited-html
 */
export const saveEditedHtml = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { editedHtmlContent } = req.body;

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      throw new AppError("Only admins can save contract edits", 403);
    }

    if (!editedHtmlContent) {
      throw new AppError("Edited HTML content is required", 400);
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const contract = await contractService.saveEditedHtml(
      id,
      editedHtmlContent,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      data: contract,
      message: "Contract edits saved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview contract from template (admin)
 * POST /api/contracts/:id/preview-from-template
 */
export const previewContractFromTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { editedData, editedHtmlContent } = req.body;

    // Only admin can preview contracts
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      throw new AppError("Only admins can preview contracts", 403);
    }

    // Get contract
    const contractData = await contractService.getContractById(id);
    const contract = contractData.contract;

    // Check if contract has a template
    if (!contract.templateId) {
      throw new AppError("Contract does not have a template", 400);
    }

    const pdfService = (await import("../services/pdfService.js")).default;

    // If edited HTML is provided (or previously saved), generate PDF directly from it
    const htmlToUse = editedHtmlContent || contract.editedHtmlContent;
    let pdfBuffer;
    if (htmlToUse) {
      pdfBuffer = await pdfService.generateContractFromHTML(htmlToUse);
    } else {
      // Get template and render from scratch
      const contractTemplateService = (await import("../services/contractTemplateService.js")).default;
      const template = await contractTemplateService.getTemplateById(contract.templateId);

      let contractDataForPdf;
      if (editedData) {
        contractDataForPdf = typeof editedData === 'string' ? JSON.parse(editedData) : editedData;
      } else {
        contractDataForPdf = JSON.parse(contract.contractData || "{}");
      }

      contractDataForPdf.contractNumber = contractData.proposal.proposalNumber
        ? contractData.proposal.proposalNumber.replace("PROP-", "CONT-")
        : "PENDING";

      pdfBuffer = await pdfService.generateContractPDF(
        contractDataForPdf,
        template.htmlTemplate
      );
    }

    // Convert to base64
    const pdfBase64 = pdfBuffer.toString("base64");

    res.status(200).json({
      success: true,
      data: pdfBase64,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get rendered HTML of a contract (compiled Handlebars template)
 * GET /api/contracts/:id/rendered-html
 */
export const getRenderedHtml = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      throw new AppError("Only admins can access rendered contract HTML", 403);
    }

    const contractData = await contractService.getContractById(id);
    const contract = contractData.contract;

    // If previously edited HTML exists, return it directly
    if (contract.editedHtmlContent) {
      return res.status(200).json({
        success: true,
        data: { html: contract.editedHtmlContent },
      });
    }

    if (!contract.templateId) {
      throw new AppError("Contract does not have a template", 400);
    }

    const contractTemplateService = (await import("../services/contractTemplateService.js")).default;
    const template = await contractTemplateService.getTemplateById(contract.templateId);

    let contractDataForRender;
    try {
      contractDataForRender = JSON.parse(contract.contractData || "{}");
    } catch (error) {
      throw new AppError("Invalid contract data", 400);
    }

    contractDataForRender.contractNumber = contractData.proposal.proposalNumber
      ? contractData.proposal.proposalNumber.replace("PROP-", "CONT-")
      : "PENDING";

    const pdfService = (await import("../services/pdfService.js")).default;
    const html = pdfService.renderContractTemplate(
      contractDataForRender,
      template.htmlTemplate
    );

    res.status(200).json({
      success: true,
      data: { html },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sales sends contract to client
 * POST /api/contracts/:id/send-to-client
 */
export const sendToClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clientEmail } = req.body;

    // Only sales (or super_admin) can send to client
    if (req.user.role !== "sales" && req.user.role !== "super_admin") {
      throw new AppError("Only sales users can send contracts to clients", 403);
    }

    // Validate email
    if (!clientEmail) {
      throw new AppError("Client email is required", 400);
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const contract = await contractService.sendToClient(
      id,
      clientEmail,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      data: contract,
      message: "Contract sent to client successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download contract PDF
 * GET /api/contracts/:id/contract-pdf
 */
export const downloadContractPdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get contract to check permissions
    const contractData = await contractService.getContractById(id);

    // Permission check: sales can only download their own contracts
    if (
      req.user.role === "sales" &&
      !req.user.isMasterSales &&
      contractData.proposal.requestedBy !== req.user.id
    ) {
      throw new AppError("Access denied", 403);
    }

    // Get PDF buffer
    const pdfBuffer = await contractService.getContractPdf(id);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="contract-${id}.pdf"`
    );

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Preview contract PDF
 * GET /api/contracts/:id/preview-pdf
 */
export const previewContractPdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get contract to check permissions
    const contractData = await contractService.getContractById(id);

    // Permission check: sales can only preview their own contracts
    if (
      req.user.role === "sales" &&
      !req.user.isMasterSales &&
      contractData.proposal.requestedBy !== req.user.id
    ) {
      throw new AppError("Access denied", 403);
    }

    // Get PDF buffer
    const pdfBuffer = await contractService.getContractPdf(id);

    // Set response headers for inline display
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="contract-${id}.pdf"`);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Download custom contract template (proxied from S3)
 * GET /api/contracts/:id/custom-template
 */
export const downloadCustomTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contractData = await contractService.getContractById(id);

    // Permission check: sales can only download their own contracts
    if (
      req.user.role === "sales" &&
      !req.user.isMasterSales &&
      contractData.proposal.requestedBy !== req.user.id
    ) {
      throw new AppError("Access denied", 403);
    }

    if (!contractData.contract.customTemplateUrl) {
      throw new AppError("No custom template found for this contract", 404);
    }

    const key = contractData.contract.customTemplateUrl;
    const buffer = await getObject(key);

    // Determine content type from key extension
    let contentType = "application/octet-stream";
    if (key.endsWith(".pdf")) contentType = "application/pdf";
    else if (key.endsWith(".docx"))
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (key.endsWith(".doc")) contentType = "application/msword";

    const filename = key.split("/").pop();
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Get contract status for client-facing page (public, token-based)
 * GET /api/contracts/public/:id/status?token=...
 */
export const getContractStatusPublic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      throw new AppError("Missing authentication token", 400);
    }

    const contractData = await contractService.validateSubmissionToken(id, token);
    const contract = contractData.contract;
    const inquiry = contractData.inquiry;

    res.json({
      success: true,
      data: {
        contractId: contract.id,
        clientName: contract.clientName || inquiry?.name,
        companyName: contract.companyName || inquiry?.company,
        sentAt: contract.sentToClientAt,
        status: contract.status,
        alreadySigned: !!contract.signedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle client signed contract submission (public, token-based)
 * POST /api/contracts/public/:id/submit?token=...
 */
export const handleClientSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      throw new AppError("Missing authentication token", 400);
    }

    // Validate token (also checks status is sent_to_client)
    await contractService.validateSubmissionToken(id, token);

    // Validate file
    if (!req.file) {
      throw new AppError("Please upload your signed contract PDF", 400);
    }

    // Upload signed contract to S3
    const dateFolder = new Date().toISOString().split("T")[0];
    const key = `signed-contracts/${dateFolder}/${id}-signed.pdf`;
    await uploadObject(key, req.file.buffer, "application/pdf");

    // Record signing + auto-create client
    await contractService.recordClientSigning(id, key, req.ip);

    res.json({
      success: true,
      message: "Thank you! Your signed contract has been received successfully.",
      data: {
        contractId: id,
        signedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload hardbound scanned contract (admin only, requires auth)
 * POST /api/contracts/:id/upload-hardbound
 */
export const uploadHardboundContract = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      throw new AppError("Only admin users can upload hardbound contracts", 403);
    }

    if (!req.file) {
      throw new AppError("Please upload the hardbound contract PDF", 400);
    }

    // Upload to S3
    const dateFolder = new Date().toISOString().split("T")[0];
    const key = `hardbound-contracts/${dateFolder}/${id}-hardbound.pdf`;
    await uploadObject(key, req.file.buffer, "application/pdf");

    // Update contract status
    const contract = await contractService.uploadHardboundContract(id, key, req.user.id);

    res.json({
      success: true,
      message: "Hardbound contract uploaded successfully",
      data: contract,
    });
  } catch (error) {
    next(error);
  }
};
