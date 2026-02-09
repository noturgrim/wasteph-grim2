import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  completeEvent,
  deleteEvent,
  autoSchedule,
} from "../controllers/calendarEventController.js";
import { requireAuth } from "../middleware/auth.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Event validation
const eventValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").optional().trim(),
  body("eventType").optional().trim(),
  body("scheduledDate").notEmpty().isISO8601().withMessage("Valid scheduled date is required"),
  body("startTime").optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("Start time must be in HH:MM format"),
  body("endTime").optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("End time must be in HH:MM format"),
  body("inquiryId").optional().isUUID().withMessage("Inquiry ID must be a valid UUID"),
  body("notes").optional().trim(),
];

// All routes require authentication
router.use(requireAuth);

// Routes
router.post("/auto-schedule", autoSchedule); // Must be before /:id
router.post("/", eventValidation, validate, createEvent);
router.get("/", getEvents);
router.get("/:id", getEventById);
router.patch("/:id", updateEvent);
router.post("/:id/complete", completeEvent);
router.delete("/:id", deleteEvent);

export default router;
