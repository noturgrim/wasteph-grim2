import express from "express";
import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  claimLead,
  deleteLead,
} from "../controllers/leadController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { leadValidation, validate } from "../middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

router.post("/", leadValidation, validate, createLead);
router.get("/", getAllLeads);
router.get("/:id", getLeadById);
router.patch("/:id", updateLead);
router.post("/:id/claim", claimLead);
router.delete("/:id", requireRole("admin", "manager"), deleteLead);

export default router;
