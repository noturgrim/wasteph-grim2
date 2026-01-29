import contractService from "../services/contractService.js";
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

    // Only sales can request contracts
    if (req.user.role !== "sales") {
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
    if (req.user.role !== "admin") {
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
 * Admin sends contract to sales
 * POST /api/contracts/:id/send-to-sales
 */
export const sendToSales = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only admin can send to sales
    if (req.user.role !== "admin") {
      throw new AppError("Only admins can send contracts to sales", 403);
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const contract = await contractService.sendToSales(
      id,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      data: contract,
      message: "Contract sent to sales successfully",
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

    // Only sales can send to client
    if (req.user.role !== "sales") {
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
