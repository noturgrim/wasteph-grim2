import express from "express";
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, updateUserProfilePicture, getUserProfilePicture } from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import multer from "multer";
import { uploadObject } from "../services/s3Service.js";
import { generateSafeFilename, sanitizeFilename, validateFileSignature } from "../utils/fileUtils.js";

const router = express.Router();

// Multer configuration for profile pictures (images only)
const uploadProfilePicture = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images (JPEG, PNG, WEBP, GIF) are allowed"), false);
    }
  },
});

// Middleware to upload profile picture to S3
const s3UploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const userId = req.params.id;
    const fileName = generateSafeFilename(req.file.originalname);
    const s3Key = `profile-pictures/${userId}/${fileName}`;

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

// Read routes - all authenticated users can view users
router.get("/", requireAuth, getAllUsers);
router.get("/:id", requireAuth, getUserById);

// Profile picture routes - users can update their own, super_admin can update any
router.patch(
  "/:id/profile-picture",
  requireAuth,
  uploadProfilePicture.single("profilePicture"),
  validateFileSignature,
  s3UploadProfilePicture,
  updateUserProfilePicture
);
router.get("/:id/profile-picture", requireAuth, getUserProfilePicture);

// Write routes - super_admin only
router.post("/", requireAuth, requireRole("super_admin"), createUser);
router.patch("/:id", requireAuth, requireRole("super_admin"), updateUser);
router.delete("/:id", requireAuth, requireRole("super_admin"), deleteUser);

export default router;
