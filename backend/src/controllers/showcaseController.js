import showcaseService from "../services/showcaseService.js";

/**
 * Showcase Controller
 * Handles HTTP requests for showcase management
 */

/**
 * Get active showcases (public endpoint)
 * Route: GET /api/showcases
 * Access: Public
 */
export const getActiveShowcases = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const showcases = await showcaseService.getActiveShowcases(limit);

    res.json({
      success: true,
      data: showcases,
      count: showcases.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all showcases (admin)
 * Route: GET /api/showcases/all
 * Access: Protected
 */
export const getAllShowcases = async (req, res, next) => {
  try {
    const showcases = await showcaseService.getAllShowcases();

    res.json({
      success: true,
      data: showcases,
      count: showcases.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get showcase by ID
 * Route: GET /api/showcases/:id
 * Access: Protected
 */
export const getShowcaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const showcase = await showcaseService.getShowcaseById(id);

    if (!showcase) {
      return res.status(404).json({
        success: false,
        message: "Showcase not found",
      });
    }

    res.json({
      success: true,
      data: showcase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new showcase
 * Route: POST /api/showcases
 * Access: Protected
 */
export const createShowcase = async (req, res, next) => {
  try {
    const showcaseData = req.body;
    const userId = req.user.id;

    const showcase = await showcaseService.createShowcase(showcaseData, userId);

    res.status(201).json({
      success: true,
      message: "Showcase created successfully",
      data: showcase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update showcase
 * Route: PUT /api/showcases/:id
 * Access: Protected
 */
export const updateShowcase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const showcaseData = req.body;

    const showcase = await showcaseService.updateShowcase(id, showcaseData);

    if (!showcase) {
      return res.status(404).json({
        success: false,
        message: "Showcase not found",
      });
    }

    res.json({
      success: true,
      message: "Showcase updated successfully",
      data: showcase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete showcase
 * Route: DELETE /api/showcases/:id
 * Access: Protected
 */
export const deleteShowcase = async (req, res, next) => {
  try {
    const { id } = req.params;

    const showcase = await showcaseService.deleteShowcase(id);

    if (!showcase) {
      return res.status(404).json({
        success: false,
        message: "Showcase not found",
      });
    }

    res.json({
      success: true,
      message: "Showcase deleted successfully",
      data: showcase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle showcase active status
 * Route: PATCH /api/showcases/:id/toggle
 * Access: Protected
 */
export const toggleShowcaseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const showcase = await showcaseService.toggleShowcaseStatus(id);

    res.json({
      success: true,
      message: `Showcase ${showcase.isActive ? "activated" : "deactivated"} successfully`,
      data: showcase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update display order
 * Route: PATCH /api/showcases/:id/order
 * Access: Protected
 */
export const updateDisplayOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { displayOrder } = req.body;

    if (displayOrder === undefined || displayOrder === null) {
      return res.status(400).json({
        success: false,
        message: "Display order is required",
      });
    }

    const showcase = await showcaseService.updateDisplayOrder(id, displayOrder);

    res.json({
      success: true,
      message: "Display order updated successfully",
      data: showcase,
    });
  } catch (error) {
    next(error);
  }
};
