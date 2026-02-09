import express from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadObject } from "../services/s3Service.js";
import { generateSafeFilename, sanitizeFilename } from "../utils/fileUtils.js";
import {
  getActiveShowcases,
  getAllShowcases,
  getShowcaseById,
  createShowcase,
  updateShowcase,
  deleteShowcase,
  toggleShowcaseStatus,
  updateDisplayOrder,
  uploadImage,
} from "../controllers/showcaseController.js";

const router = express.Router();

// Multer configuration for showcase images
const uploadShowcaseImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
    }
  },
});

// S3 upload middleware for showcase images
const s3UploadShowcaseImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(); // No file uploaded, continue
    }

    const showcaseId = req.params.id;
    const fileName = generateSafeFilename(req.file.originalname);
    const s3Key = `showcases/images/${showcaseId}/${fileName}`;

    await uploadObject(s3Key, req.file.buffer, req.file.mimetype);

    // Attach S3 key to request body
    req.body.image = s3Key;
    req.body.imageName = sanitizeFilename(req.file.originalname);

    next();
  } catch (error) {
    next(error);
  }
};

// Public routes
router.get("/", getActiveShowcases);

// Protected routes (require authentication)
router.get("/all", requireAuth, getAllShowcases);
router.get("/:id", requireAuth, getShowcaseById);
router.post("/", requireAuth, createShowcase);
router.put("/:id", requireAuth, updateShowcase);
router.delete("/:id", requireAuth, deleteShowcase);
router.patch("/:id/toggle", requireAuth, toggleShowcaseStatus);
router.patch("/:id/order", requireAuth, updateDisplayOrder);

// Image upload route
router.post(
  "/:id/upload-image",
  requireAuth,
  requireRole("super_admin", "social_media"),
  uploadShowcaseImage.single("image"),
  s3UploadShowcaseImage,
  uploadImage
);

export default router;
