import express from "express";
import {
  createInquiry,
  createInquiryManual,
  getAllInquiries,
  getInquiryById,
  updateInquiry,
  convertInquiryToLead,
  deleteInquiry,
} from "../controllers/inquiryController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { inquiryValidation, validate } from "../middleware/validation.js";

const router = express.Router();

// Public route - create inquiry from website
router.post("/", inquiryValidation, validate, createInquiry);

// Protected routes - manual create (Sales/Admin)
router.post("/manual", requireAuth, inquiryValidation, validate, createInquiryManual);

// Convert inquiry to lead - MUST be before /:id routes
router.post("/:id/convert-to-lead", requireAuth, convertInquiryToLead);

// Protected routes - all authenticated users
router.get("/", requireAuth, getAllInquiries);
router.get("/:id", requireAuth, getInquiryById);
router.patch("/:id", requireAuth, updateInquiry);

// Delete - all authenticated users (including sales)
router.delete("/:id", requireAuth, deleteInquiry);

export default router;
