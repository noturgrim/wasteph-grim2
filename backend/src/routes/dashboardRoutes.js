import express from "express";
import {
  getSalesDashboard,
  getSuperAdminDashboard,
  getAnalyticsDashboard,
  getAdminAnalyticsDashboard,
} from "../controllers/dashboardController.js";
import { requireAuth, requireRole, requireMasterSales } from "../middleware/auth.js";

const router = express.Router();

// GET /api/dashboard/sales — sales dashboard stats for the logged-in user
router.get("/sales", requireAuth, getSalesDashboard);

// GET /api/dashboard/admin — system-wide admin dashboard
router.get(
  "/admin",
  requireAuth,
  requireRole("admin", "super_admin"),
  getSuperAdminDashboard,
);

// GET /api/dashboard/admin/analytics — admin analytics dashboard
router.get(
  "/admin/analytics",
  requireAuth,
  requireRole("admin", "super_admin"),
  getAdminAnalyticsDashboard,
);

// GET /api/dashboard/analytics — analytics dashboard for master sales
router.get("/analytics", requireAuth, requireMasterSales, getAnalyticsDashboard);

export default router;
