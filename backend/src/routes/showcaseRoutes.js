import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getActiveShowcases,
  getAllShowcases,
  getShowcaseById,
  createShowcase,
  updateShowcase,
  deleteShowcase,
  toggleShowcaseStatus,
  updateDisplayOrder,
} from "../controllers/showcaseController.js";

const router = express.Router();

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

export default router;
