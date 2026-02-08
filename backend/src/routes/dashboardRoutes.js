import express from "express";
import {
  getSalesDashboard,
  getSuperAdminDashboard,
} from "../controllers/dashboardController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

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

export default router;
