import PotentialService from "../services/potentialService.js";

// Initialize service
const potentialService = new PotentialService();

/**
 * Controller: Create potential client
 * Route: POST /api/potentials
 * Access: Protected (all authenticated users)
 */
export const createPotential = async (req, res, next) => {
  try {
    const potentialData = req.body;
    const userId = req.user.id;

    const potential = await potentialService.createPotential(potentialData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Potential client created successfully",
      data: potential,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all potentials
 * Route: GET /api/potentials
 * Access: Protected (all authenticated users)
 */
export const getAllPotentials = async (req, res, next) => {
  try {
    const potentials = await potentialService.getAllPotentials();

    res.json({
      success: true,
      data: potentials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get potential by ID
 * Route: GET /api/potentials/:id
 * Access: Protected (all authenticated users)
 */
export const getPotentialById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const potential = await potentialService.getPotentialById(id);

    res.json({
      success: true,
      data: potential,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update potential
 * Route: PATCH /api/potentials/:id
 * Access: Protected (all authenticated users)
 */
export const updatePotential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const potential = await potentialService.updatePotential(id, updateData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Potential client updated successfully",
      data: potential,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete potential
 * Route: DELETE /api/potentials/:id
 * Access: Protected (admin, manager only)
 */
export const deletePotential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await potentialService.deletePotential(id, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Potential client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
