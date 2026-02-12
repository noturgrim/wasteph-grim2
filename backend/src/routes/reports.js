import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getLoadTestReport,
  downloadLoadTestReport,
} from "../controllers/reportsController.js";

const router = express.Router();

/**
 * GET /api/reports/load-test
 * View the load test report (HTML)
 * Access: Admin, Super Admin only
 */
router.get(
  "/load-test",
  requireAuth,
  requireRole("admin", "super_admin"),
  getLoadTestReport
);

/**
 * GET /api/reports/load-test/download
 * Download the load test report
 * Access: Admin, Super Admin only
 */
router.get(
  "/load-test/download",
  requireAuth,
  requireRole("admin", "super_admin"),
  downloadLoadTestReport
);

export default router;
