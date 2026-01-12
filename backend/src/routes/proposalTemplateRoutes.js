import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  getDefaultTemplate,
  updateTemplate,
  setDefaultTemplate,
  deleteTemplate,
  previewTemplate,
  getTemplateByType,
  getTemplatesByCategory,
  suggestTemplateForInquiry,
} from "../controllers/proposalTemplateController.js";
import {
  validateCreateTemplate,
  validateUpdateTemplate,
  validatePreviewTemplate,
} from "../middleware/proposalValidation.js";

const router = Router();

/**
 * Proposal Template Routes
 * All routes require authentication
 * Most routes are admin-only (enforced in controller)
 */

// Get default template (before /api/proposal-templates/:id to avoid route collision)
router.get("/default", requireAuth, getDefaultTemplate);

// Get templates grouped by category
router.get("/by-category", requireAuth, getTemplatesByCategory);

// Get template by type
router.get("/type/:type", requireAuth, getTemplateByType);

// Suggest template for inquiry
router.get("/suggest/:inquiryId", requireAuth, suggestTemplateForInquiry);

// Preview template rendering
router.post("/preview", requireAuth, validatePreviewTemplate, previewTemplate);

// Create template (Admin only)
router.post("/", requireAuth, validateCreateTemplate, createTemplate);

// Get all templates
router.get("/", requireAuth, getAllTemplates);

// Get template by ID
router.get("/:id", requireAuth, getTemplateById);

// Update template (Admin only)
router.put("/:id", requireAuth, validateUpdateTemplate, updateTemplate);

// Set template as default (Admin only)
router.post("/:id/set-default", requireAuth, setDefaultTemplate);

// Delete template (Admin only)
router.delete("/:id", requireAuth, deleteTemplate);

export default router;
