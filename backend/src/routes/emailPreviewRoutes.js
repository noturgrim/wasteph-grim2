import express from "express";
import {
  previewEmailList,
  previewNewLeadEmail,
  previewProposalAcceptedEmail,
  previewProposalDeclinedEmail,
  previewProposalDisapprovedEmail,
  previewContractSignedEmail,
  previewSimpleProposalEmail,
  previewFullProposalEmail,
  previewContractEmail,
  previewNotificationEmail,
  previewNewTicketEmail,
  previewTicketStatusUpdateEmail,
  previewTicketCommentEmail,
  previewEventAssignedEmail,
  preview24HourReminderEmail,
  preview1HourReminderEmail,
  previewAutoScheduleSalesEmail,
  previewAutoScheduleClientEmail,
} from "../controllers/emailPreviewController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// All preview routes require authentication and admin/super_admin role for security
router.use(requireAuth);
router.use(requireRole("admin", "super_admin"));

// Email preview list page
router.get("/", previewEmailList);

// Internal notification email previews
router.get("/new-lead", previewNewLeadEmail);
router.get("/proposal-accepted", previewProposalAcceptedEmail);
router.get("/proposal-declined", previewProposalDeclinedEmail);
router.get("/proposal-disapproved", previewProposalDisapprovedEmail);
router.get("/contract-signed", previewContractSignedEmail);
router.get("/new-ticket", previewNewTicketEmail);
router.get("/ticket-status-update", previewTicketStatusUpdateEmail);
router.get("/ticket-comment", previewTicketCommentEmail);

// Calendar event email previews
router.get("/event-assigned", previewEventAssignedEmail);
router.get("/event-reminder-24h", preview24HourReminderEmail);
router.get("/event-reminder-1h", preview1HourReminderEmail);
router.get("/auto-schedule-sales", previewAutoScheduleSalesEmail);
router.get("/auto-schedule-client", previewAutoScheduleClientEmail);

// Client-facing email previews
router.get("/simple-proposal", previewSimpleProposalEmail);
router.get("/full-proposal", previewFullProposalEmail);
router.get("/contract", previewContractEmail);
router.get("/notification", previewNotificationEmail);

export default router;
