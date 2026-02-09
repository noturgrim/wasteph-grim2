import express from "express";
import multer from "multer";
import * as blogController from "../controllers/blogController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadObject } from "../services/s3Service.js";
import { generateSafeFilename, sanitizeFilename } from "../utils/fileUtils.js";

const router = express.Router();

// Multer configuration for blog cover images
const uploadCoverImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
    }
  },
});

// S3 upload middleware for cover images
const s3UploadCoverImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(); // No file uploaded, continue (optional field)
    }

    const postId = req.params.id;
    const fileName = generateSafeFilename(req.file.originalname);
    const s3Key = `blog/covers/${postId}/${fileName}`;

    await uploadObject(s3Key, req.file.buffer, req.file.mimetype);

    // Attach S3 key to request body
    req.body.coverImage = s3Key;
    req.body.coverImageName = sanitizeFilename(req.file.originalname);

    next();
  } catch (error) {
    next(error);
  }
};

// Public routes
router.get("/", blogController.getPublishedPosts);
router.get("/category/:category", blogController.getPostsByCategory);
router.get("/:slug", blogController.getPublishedPostBySlug);

// Admin routes (protected - super_admin and social_media only)
router.get("/admin/stats", requireAuth, requireRole("super_admin", "social_media"), blogController.getBlogStats);
router.get("/admin/all", requireAuth, requireRole("super_admin", "social_media"), blogController.getAllPosts);
router.get("/admin/:id", requireAuth, requireRole("super_admin", "social_media"), blogController.getPostById);
router.post("/admin", requireAuth, requireRole("super_admin", "social_media"), blogController.createPost);
router.put("/admin/:id", requireAuth, requireRole("super_admin", "social_media"), blogController.updatePost);
router.delete("/admin/:id", requireAuth, requireRole("super_admin", "social_media"), blogController.deletePost);

// Cover image upload route
router.post(
  "/admin/:id/upload-cover",
  requireAuth,
  requireRole("super_admin", "social_media"),
  uploadCoverImage.single("coverImage"),
  s3UploadCoverImage,
  blogController.uploadCoverImage
);

export default router;
