import { z } from "zod";
import { AppError } from "./errorHandler.js";

/**
 * Validation Middleware for Proposal and Proposal Template endpoints
 * Uses Zod for schema validation
 */

// ===== PROPOSAL VALIDATIONS =====

const proposalDataSchema = z.object({
  services: z
    .array(
      z.object({
        name: z.string().min(1, "Service name is required"),
        description: z.string().optional(),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.number().min(0, "Unit price must be non-negative"),
        subtotal: z.number().min(0, "Subtotal must be non-negative"),
        wasteAllowance: z.number().min(0).optional(), // Template-specific
      })
    )
    .min(1, "At least one service is required"),

  pricing: z.object({
    subtotal: z.number().min(0, "Subtotal must be non-negative"),
    tax: z.number().min(0, "Tax must be non-negative").optional(),
    discount: z.number().min(0, "Discount must be non-negative").optional(),
    total: z.number().min(0, "Total must be non-negative"),
    taxRate: z.number().min(0).max(100).optional(),
  }),

  terms: z.object({
    paymentTerms: z.string().optional(),
    validityDays: z.number().int().min(1).max(365).optional(),
    notes: z.string().optional(),
  }),

  // Template-specific optional fields
  wasteAllowance: z.number().min(0).optional(),
  excessRate: z.number().min(0).optional(),
  equipment: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().min(1),
        hours: z.number().min(0).optional(),
        rate: z.number().min(0),
        subtotal: z.number().min(0),
      })
    )
    .optional(),
});

const createProposalSchema = z.object({
  inquiryId: z.string().uuid("Invalid inquiry ID format"),
  templateId: z.string().uuid("Invalid template ID format").optional(),
  proposalData: proposalDataSchema,
});

const updateProposalSchema = z.object({
  proposalData: proposalDataSchema.optional(),
  templateId: z.string().uuid("Invalid template ID format").optional(),
});

const approveProposalSchema = z.object({
  adminNotes: z.string().optional(),
});

const rejectProposalSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

// ===== PROPOSAL TEMPLATE VALIDATIONS =====

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  htmlTemplate: z.string().min(1, "HTML template is required"),
  isDefault: z.boolean().optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").optional(),
  description: z.string().optional(),
  htmlTemplate: z.string().min(1, "HTML template is required").optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const previewTemplateSchema = z.object({
  templateHtml: z.string().min(1, "Template HTML is required"),
  sampleData: z.object({}).passthrough(),
});

// ===== MIDDLEWARE FUNCTIONS =====

/**
 * Validate create proposal request
 */
export const validateCreateProposal = (req, res, next) => {
  try {
    createProposalSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return next(new AppError(`Validation error: ${errorMessages}`, 400));
    }
    next(error);
  }
};

/**
 * Validate update proposal request
 */
export const validateUpdateProposal = (req, res, next) => {
  try {
    updateProposalSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return next(new AppError(`Validation error: ${errorMessages}`, 400));
    }
    next(error);
  }
};

/**
 * Validate approve proposal request
 */
export const validateApproveProposal = (req, res, next) => {
  try {
    approveProposalSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return next(new AppError(`Validation error: ${errorMessages}`, 400));
    }
    next(error);
  }
};

/**
 * Validate reject proposal request
 */
export const validateRejectProposal = (req, res, next) => {
  try {
    rejectProposalSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return next(new AppError(`Validation error: ${errorMessages}`, 400));
    }
    next(error);
  }
};

/**
 * Validate create template request
 */
export const validateCreateTemplate = (req, res, next) => {
  try {
    createTemplateSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return next(new AppError(`Validation error: ${errorMessages}`, 400));
    }
    next(error);
  }
};

/**
 * Validate update template request
 */
export const validateUpdateTemplate = (req, res, next) => {
  try {
    updateTemplateSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return next(new AppError(`Validation error: ${errorMessages}`, 400));
    }
    next(error);
  }
};

/**
 * Validate preview template request
 */
export const validatePreviewTemplate = (req, res, next) => {
  try {
    previewTemplateSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return next(new AppError(`Validation error: ${errorMessages}`, 400));
    }
    next(error);
  }
};
