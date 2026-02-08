import serviceService from "../services/serviceService.js";

/**
 * ServiceController - Handle HTTP requests for service operations
 */

/**
 * Get all services
 * GET /api/services
 */
export const getAllServices = async (req, res, next) => {
  try {
    const services = await serviceService.getAllServices();

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get service by ID with default template
 * GET /api/services/:id
 */
export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(id);

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sub-types for a service
 * GET /api/services/:id/sub-types
 */
export const getServiceSubTypes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subTypes = await serviceService.getSubTypes(id);

    res.status(200).json({
      success: true,
      data: subTypes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get template for a service
 * GET /api/services/:id/template
 */
export const getTemplateForService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await serviceService.getTemplateForService(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "No template configured for this service",
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};
