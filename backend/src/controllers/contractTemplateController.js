import contractTemplateService from "../services/contractTemplateService.js";
import pdfService from "../services/pdfService.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * ContractTemplateController - Handle HTTP requests for contract template operations
 * Admin endpoints for template management
 */

/**
 * Create a new contract template
 * POST /api/contract-templates
 * Admin only
 */
export const createTemplate = async (req, res, next) => {
  try {
    // Only admin can create templates
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      throw new AppError("Only admins can create contract templates", 403);
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const template = await contractTemplateService.createTemplate(
      req.body,
      req.user.id,
      metadata
    );

    res.status(201).json({
      success: true,
      data: template,
      message: "Contract template created successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all contract templates
 * GET /api/contract-templates
 */
export const getAllTemplates = async (req, res, next) => {
  try {
    const { isActive, templateType, search, page, limit } = req.query;

    const result = await contractTemplateService.getAllTemplates({
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      templateType,
      search,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get template by ID
 * GET /api/contract-templates/:id
 */
export const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await contractTemplateService.getTemplateById(id);

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get default template
 * GET /api/contract-templates/default
 */
export const getDefaultTemplate = async (req, res, next) => {
  try {
    const template = await contractTemplateService.getDefaultTemplate();

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get template by contract type
 * GET /api/contract-templates/type/:type
 */
export const getTemplateByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const template = await contractTemplateService.getTemplateByType(type);

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update contract template
 * PUT /api/contract-templates/:id
 * Admin only
 */
export const updateTemplate = async (req, res, next) => {
  try {
    // Only admin can update templates
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      throw new AppError("Only admins can update contract templates", 403);
    }

    const { id } = req.params;
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const template = await contractTemplateService.updateTemplate(
      id,
      req.body,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      data: template,
      message: "Contract template updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set template as default
 * POST /api/contract-templates/:id/set-default
 * Admin only
 */
export const setDefaultTemplate = async (req, res, next) => {
  try {
    // Only admin can set default
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      throw new AppError("Only admins can set default templates", 403);
    }

    const { id } = req.params;
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const template = await contractTemplateService.setDefaultTemplate(
      id,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      data: template,
      message: "Template set as default successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete (soft delete) contract template
 * DELETE /api/contract-templates/:id
 * Admin only
 */
export const deleteTemplate = async (req, res, next) => {
  try {
    // Only admin can delete templates
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      throw new AppError("Only admins can delete contract templates", 403);
    }

    const { id } = req.params;
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };

    const template = await contractTemplateService.deleteTemplate(
      id,
      req.user.id,
      metadata
    );

    res.status(200).json({
      success: true,
      data: template,
      message: "Contract template deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview template rendering
 * POST /api/contract-templates/preview
 */
export const previewTemplate = async (req, res, next) => {
  try {
    const { templateHtml, sampleData } = req.body;

    if (!templateHtml || !sampleData) {
      throw new AppError(
        "Both templateHtml and sampleData are required",
        400
      );
    }

    // Render HTML server-side (helpers like {{currency}} are registered at startup)
    const html = pdfService.renderProposalTemplate(sampleData, templateHtml);

    // Generate PDF
    const pdfBuffer = await pdfService.generateContractFromHTML(html);

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
