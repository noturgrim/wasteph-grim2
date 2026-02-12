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

/**
 * Controller: Get super admin dashboard data
 * Route: GET /api/dashboard/admin
 * Access: Protected (admin, super_admin)
 */
export const getSuperAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getSuperAdminDashboard();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get analytics dashboard data
 * Route: GET /api/dashboard/analytics
 * Access: Protected (master sales only)
 */
export const getAnalyticsDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAnalyticsDashboard();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get admin analytics dashboard data
 * Route: GET /api/dashboard/admin/analytics
 * Access: Protected (admin, super_admin)
 */
export const getAdminAnalyticsDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAdminAnalyticsDashboard();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
