import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateRequestContract } from "../middleware/contractValidation.js";
import multer from "multer";
import * as controller from "../controllers/contractController.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Configure multer for PDF uploads (strict - contracts only)
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Configure multer for template uploads (PDF or Word documents)
const uploadTemplate = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF or Word documents are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// LIST & RETRIEVE
router.get("/", controller.getAllContracts);
router.get("/:id", controller.getContractById);

// SALES OPERATIONS
router.post(
  "/:id/request",
  uploadTemplate.single("customTemplate"),
  validateRequestContract,
  controller.requestContract,
);
router.post("/:id/send-to-client", controller.sendToClient);

// ADMIN OPERATIONS
router.post(
  "/:id/upload-pdf",
  uploadPdf.single("contractPdf"),
  controller.uploadContractPdf,
);
router.post("/:id/generate-from-template", controller.generateContractFromTemplate);
router.post("/:id/preview-from-template", controller.previewContractFromTemplate);
router.post("/:id/send-to-sales", controller.sendToSales);

// PDF OPERATIONS
router.get("/:id/contract-pdf", controller.downloadContractPdf);
router.get("/:id/pdf", controller.downloadContractPdf); // Alias for easier access
router.get("/:id/preview-pdf", controller.previewContractPdf);

export default router;
