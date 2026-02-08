import leadService from "../services/leadServiceWithSocket.js";

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
 * Controller: Get all leads (with optional filters and pagination)
 * Route: GET /api/leads?page=1&limit=20&status=new&search=...
 * Access: Protected (all authenticated users)
 */
export const getAllLeads = async (req, res, next) => {
  try {
    const { isClaimed, claimedBy, search, serviceType, page, limit } = req.query;

    const result = await leadService.getAllLeads({
      isClaimed,
      claimedBy,
      search,
      serviceType,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
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
 * Controller: Claim lead
 * Route: POST /api/leads/:id/claim
 * Access: Protected (all authenticated users)
 */
export const claimLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { source } = req.body;
    const userId = req.user.id;

    const { inquiry } = await leadService.claimLead(id, userId, source, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Lead claimed successfully",
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete lead
 * Route: DELETE /api/leads/:id
 * Access: Protected (Master Sales only)
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

/**
 * Controller: Bulk delete leads
 * Route: POST /api/leads/bulk-delete
 * Access: Protected (Master Sales only)
 */
export const bulkDeleteLeads = async (req, res, next) => {
  try {
    const { leadIds } = req.body;
    const userId = req.user.id;

    if (!leadIds || !Array.isArray(leadIds)) {
      return res.status(400).json({
        success: false,
        message: "leadIds must be an array",
      });
    }

    const result = await leadService.bulkDeleteLeads(leadIds, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: `Bulk delete completed: ${result.deleted} deleted, ${result.failed} failed`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
