import express from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadObject } from "../services/s3Service.js";
import { generateSafeFilename, sanitizeFilename, validateFileSignature } from "../utils/fileUtils.js";
import {
  getActiveClientsShowcase,
  getAllClientsShowcase,
  getClientsShowcaseById,
  createClientsShowcase,
  updateClientsShowcase,
  deleteClientsShowcase,
  toggleClientsShowcaseStatus,
  uploadLogo,
} from "../controllers/clientsShowcaseController.js";

const router = express.Router();

// Multer configuration for client showcase logos
const uploadClientLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for logos
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and SVG images are allowed"), false);
    }
  },
});

// S3 upload middleware for client logos
const s3UploadClientLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(); // No file uploaded, continue
    }

    const clientShowcaseId = req.params.id;
    const fileName = generateSafeFilename(req.file.originalname);
    const s3Key = `clients-showcase/logos/${clientShowcaseId}/${fileName}`;

    await uploadObject(s3Key, req.file.buffer, req.file.mimetype);

    // Attach S3 key to request body
    req.body.logo = s3Key;
    req.body.logoName = sanitizeFilename(req.file.originalname);

    next();
  } catch (error) {
    next(error);
  }
};

// Public routes
router.get("/", getActiveClientsShowcase);

// Protected routes (require authentication and role)
router.get(
  "/all",
  requireAuth,
  requireRole("super_admin", "social_media"),
  getAllClientsShowcase
);
router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin", "social_media"),
  getClientsShowcaseById
);
router.post(
  "/",
  requireAuth,
  requireRole("super_admin", "social_media"),
  createClientsShowcase
);
router.put(
  "/:id",
  requireAuth,
  requireRole("super_admin", "social_media"),
  updateClientsShowcase
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin", "social_media"),
  deleteClientsShowcase
);
router.patch(
  "/:id/toggle",
  requireAuth,
  requireRole("super_admin", "social_media"),
  toggleClientsShowcaseStatus
);

// Logo upload route with error handling
router.post(
  "/:id/upload-logo",
  requireAuth,
  requireRole("super_admin", "social_media"),
  (req, res, next) => {
    uploadClientLogo.single("logo")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Logo size must be less than 10MB",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || "Failed to upload logo",
        });
      }
      next();
    });
  },
  validateFileSignature,
  s3UploadClientLogo,
  uploadLogo
);

export default router;
