import express from "express";
import settingsController from "../controllers/settingsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// All settings routes require super_admin role
router.use(requireAuth, requireRole("super_admin"));

// GET /api/settings/smtp - Get SMTP settings
router.get("/smtp", settingsController.getSMTPSettings.bind(settingsController));

// PUT /api/settings/smtp - Update SMTP settings
router.put("/smtp", settingsController.updateSMTPSettings.bind(settingsController));

// POST /api/settings/smtp/test - Test SMTP connection
router.post("/smtp/test", settingsController.testSMTPConnection.bind(settingsController));

// GET /api/settings - Get all settings
router.get("/", settingsController.getAllSettings.bind(settingsController));

export default router;
