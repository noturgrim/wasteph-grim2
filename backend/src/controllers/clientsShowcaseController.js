import clientsShowcaseService from "../services/clientsShowcaseService.js";
import {
  createClientShowcaseSchema,
  updateClientShowcaseSchema,
} from "../validation/clientsShowcaseSchema.js";

/**
 * Clients Showcase Controller
 * Handles HTTP requests for client showcase management
 */

/**
 * Get active client showcases (public endpoint)
 * Route: GET /api/clients-showcase
 * Access: Public
 */
export const getActiveClientsShowcase = async (req, res, next) => {
  try {
    const clients = await clientsShowcaseService.getActiveClientsShowcase();

    res.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all client showcases (admin)
 * Route: GET /api/clients-showcase/all
 * Access: Protected
 */
export const getAllClientsShowcase = async (req, res, next) => {
  try {
    const clients = await clientsShowcaseService.getAllClientsShowcase();

    res.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client showcase by ID
 * Route: GET /api/clients-showcase/:id
 * Access: Protected
 */
export const getClientsShowcaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await clientsShowcaseService.getClientsShowcaseById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client showcase not found",
      });
    }

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new client showcase
 * Route: POST /api/clients-showcase
 * Access: Protected
 */
export const createClientsShowcase = async (req, res, next) => {
  try {
    // Validate and sanitize input
    const validationResult = createClientShowcaseSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Use validated and sanitized data
    const clientData = validationResult.data;
    const userId = req.user.id;

    const client = await clientsShowcaseService.createClientsShowcase(clientData, userId);

    res.status(201).json({
      success: true,
      message: "Client showcase created successfully",
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update client showcase
 * Route: PUT /api/clients-showcase/:id
 * Access: Protected
 */
export const updateClientsShowcase = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate and sanitize input
    const validationResult = updateClientShowcaseSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Use validated and sanitized data
    const clientData = validationResult.data;

    const client = await clientsShowcaseService.updateClientsShowcase(id, clientData);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client showcase not found",
      });
    }

    res.json({
      success: true,
      message: "Client showcase updated successfully",
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete client showcase
 * Route: DELETE /api/clients-showcase/:id
 * Access: Protected
 */
export const deleteClientsShowcase = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await clientsShowcaseService.deleteClientsShowcase(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client showcase not found",
      });
    }

    res.json({
      success: true,
      message: "Client showcase deleted successfully",
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle client showcase active status
 * Route: PATCH /api/clients-showcase/:id/toggle
 * Access: Protected
 */
export const toggleClientsShowcaseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await clientsShowcaseService.toggleClientsShowcaseStatus(id);

    res.json({
      success: true,
      message: `Client showcase ${client.isActive ? "activated" : "deactivated"} successfully`,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};
