import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getAllServices,
  getServiceById,
  getServiceSubTypes,
  getTemplateForService,
} from "../controllers/serviceController.js";

const router = Router();

/**
 * Service Routes
 * All routes require authentication
 */

// Get all services
router.get("/", requireAuth, getAllServices);

// Get service by ID (with template)
router.get("/:id", requireAuth, getServiceById);

// Get sub-types for a service
router.get("/:id/sub-types", requireAuth, getServiceSubTypes);

// Get template for a service
router.get("/:id/template", requireAuth, getTemplateForService);

export default router;
