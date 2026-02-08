import express from "express";
import { getSalesDashboard } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/dashboard/sales — sales dashboard stats for the logged-in user
router.get("/sales", requireAuth, getSalesDashboard);

export default router;
