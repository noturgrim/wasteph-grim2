import dashboardService from "../services/dashboardService.js";

/**
 * Controller: Get sales dashboard data
 * Route: GET /api/dashboard/sales
 * Access: Protected (any authenticated user)
 */
export const getSalesDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await dashboardService.getSalesDashboard(userId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
