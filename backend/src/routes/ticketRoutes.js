import express from "express";
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  updateTicketStatus,
  addTicketComment,
  addTicketAttachment,
  deleteTicketAttachment,
  getTicketAttachmentViewUrl,
} from "../controllers/ticketController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  validateCreateTicket,
  validateUpdateTicket,
  validateUpdateTicketStatus,
  validateAddTicketComment,
  validateGetTicketsQuery,
} from "../middleware/ticketValidation.js";
import multer from "multer";
import { uploadObject } from "../services/s3Service.js";
import { generateSafeFilename, sanitizeFilename } from "../utils/fileUtils.js";

const router = express.Router();

// Multer configuration for ticket attachments
const uploadAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: images, PDF, Word, Excel, text files"), false);
    }
  },
});

// Middleware to upload file to S3
const s3Upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const ticketId = req.params.id;
    const fileName = generateSafeFilename(req.file.originalname);
    const s3Key = `tickets/${ticketId}/${fileName}`;

    // Upload to S3
    await uploadObject(s3Key, req.file.buffer, req.file.mimetype);

    // Add S3 key to request body
    req.body.fileUrl = s3Key;
    req.body.fileName = sanitizeFilename(req.file.originalname);

    next();
  } catch (error) {
    next(error);
  }
};

// All routes require authentication
router.use(requireAuth);

// Ticket routes
router.post("/", validateCreateTicket, createTicket);
router.get("/", validateGetTicketsQuery, getAllTickets);
router.get("/:id/attachments/:attachmentId/view", getTicketAttachmentViewUrl);
router.get("/:id", getTicketById);

// Update ticket (sales own, admin any)
router.patch("/:id", validateUpdateTicket, updateTicket);

// Update ticket status (admin only)
router.patch(
  "/:id/status",
  requireRole("admin", "super_admin"),
  validateUpdateTicketStatus,
  updateTicketStatus
);

// Add comment to ticket
router.post(
  "/:id/comments",
  validateAddTicketComment,
  addTicketComment
);

// Add attachment to ticket
router.post(
  "/:id/attachments",
  uploadAttachment.single("file"),
  s3Upload,
  addTicketAttachment
);

// Delete attachment from ticket
router.delete("/:id/attachments/:attachmentId", deleteTicketAttachment);

export default router;
