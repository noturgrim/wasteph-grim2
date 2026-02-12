import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getLoadTestReport,
  downloadLoadTestReport,
  getAvailableReports,
} from "../controllers/reportsController.js";

const router = express.Router();

/**
 * GET /api/reports/load-test/available
 * Get list of available load test reports
 * Access: Admin, Super Admin only
 */
router.get(
  "/load-test/available",
  requireAuth,
  requireRole("admin", "super_admin"),
  getAvailableReports
);

/**
 * GET /api/reports/load-test?type=standard|100|500
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
 * GET /api/reports/load-test/download?type=standard|100|500
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
