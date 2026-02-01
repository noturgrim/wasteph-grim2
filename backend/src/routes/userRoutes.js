import express from "express";
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Read routes - all authenticated users can view users
router.get("/", requireAuth, getAllUsers);
router.get("/:id", requireAuth, getUserById);

// Write routes - super_admin only
router.post("/", requireAuth, requireRole("super_admin"), createUser);
router.patch("/:id", requireAuth, requireRole("super_admin"), updateUser);
router.delete("/:id", requireAuth, requireRole("super_admin"), deleteUser);

export default router;
