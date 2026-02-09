import express from "express";
import {
  previewEmailList,
  previewNewLeadEmail,
  previewProposalAcceptedEmail,
  previewProposalDeclinedEmail,
  previewContractSignedEmail,
} from "../controllers/emailPreviewController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// All preview routes require authentication and admin/super_admin role for security
router.use(requireAuth);
router.use(requireRole("admin", "super_admin"));

// Email preview list page
router.get("/", previewEmailList);

// Individual email previews
router.get("/new-lead", previewNewLeadEmail);
router.get("/proposal-accepted", previewProposalAcceptedEmail);
router.get("/proposal-declined", previewProposalDeclinedEmail);
router.get("/contract-signed", previewContractSignedEmail);

export default router;
