import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  getDefaultTemplate,
  getTemplateByType,
  updateTemplate,
  setDefaultTemplate,
  deleteTemplate,
  previewTemplate,
} from "../controllers/contractTemplateController.js";

const router = Router();

/**
 * Contract Template Routes
 * All routes require authentication
 * Most routes are admin-only (enforced in controller)
 */

// Get default template (before /:id to avoid route collision)
router.get("/default", requireAuth, getDefaultTemplate);

// Get template by type
router.get("/type/:type", requireAuth, getTemplateByType);

// Preview template rendering
router.post("/preview", requireAuth, previewTemplate);

// Create template (Admin only)
router.post("/", requireAuth, createTemplate);

// Get all templates
router.get("/", requireAuth, getAllTemplates);

// Get template by ID
router.get("/:id", requireAuth, getTemplateById);

// Update template (Admin only)
router.put("/:id", requireAuth, updateTemplate);

// Set template as default (Admin only)
router.post("/:id/set-default", requireAuth, setDefaultTemplate);

// Delete template (Admin only)
router.delete("/:id", requireAuth, deleteTemplate);

export default router;
