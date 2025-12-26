import LeadService from "../services/leadService.js";

// Initialize service
const leadService = new LeadService();

/**
 * Controller: Create lead
 * Route: POST /api/leads
 * Access: Protected (all authenticated users)
 */
export const createLead = async (req, res, next) => {
  try {
    const leadData = req.body;
    const userId = req.user.id;

    const lead = await leadService.createLead(leadData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all leads
 * Route: GET /api/leads
 * Access: Protected (all authenticated users)
 */
export const getAllLeads = async (req, res, next) => {
  try {
    const leads = await leadService.getAllLeads();

    res.json({
      success: true,
      data: leads,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get lead by ID
 * Route: GET /api/leads/:id
 * Access: Protected (all authenticated users)
 */
export const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await leadService.getLeadById(id);

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update lead
 * Route: PATCH /api/leads/:id
 * Access: Protected (all authenticated users)
 */
export const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const lead = await leadService.updateLead(id, updateData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete lead
 * Route: DELETE /api/leads/:id
 * Access: Protected (admin, manager only)
 */
export const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await leadService.deleteLead(id, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
