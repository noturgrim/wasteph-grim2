import express from "express";
import {
  createClientNote,
  getAllClientNotes,
  getClientNoteById,
  updateClientNote,
  deleteClientNote,
  getClientTimeline,
} from "../controllers/clientNotesController.js";
import { requireAuth } from "../middleware/auth.js";
import {
  validateCreateClientNote,
  validateUpdateClientNote,
  validateGetClientNotesQuery,
} from "../middleware/clientNotesValidation.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Client notes routes
router.post("/", validateCreateClientNote, createClientNote);
router.get("/", validateGetClientNotesQuery, getAllClientNotes);
router.get("/:id", getClientNoteById);
router.patch("/:id", validateUpdateClientNote, updateClientNote);
router.delete("/:id", deleteClientNote);

// Client timeline route
router.get("/client/:clientId/timeline", getClientTimeline);

export default router;
