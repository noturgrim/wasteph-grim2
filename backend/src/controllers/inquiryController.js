import inquiryService from "../services/inquiryService.js";

/**
 * Controller: Create inquiry (public endpoint for website forms)
 * Route: POST /api/inquiries
 * Access: Public
 */
export const createInquiry = async (req, res, next) => {
  try {
    const inquiryData = req.body;

    const inquiry = await inquiryService.createInquiry(inquiryData, {
      source: "website",
    });

    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Create inquiry manually (by Sales/Admin)
 * Route: POST /api/inquiries/manual
 * Access: Protected (authenticated users)
 */
export const createInquiryManual = async (req, res, next) => {
  try {
    const inquiryData = req.body;
    const userId = req.user.id;

    const inquiry = await inquiryService.createInquiryManual(inquiryData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Inquiry created successfully",
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all inquiries (with optional filters and pagination)
 * Route: GET /api/inquiries?page=1&limit=20&status=new&search=...
 * Access: Protected (all authenticated users)
 */
export const getAllInquiries = async (req, res, next) => {
  try {
    const { status, assignedTo, search, source, serviceType, page, limit } = req.query;

    const result = await inquiryService.getAllInquiries({
      status,
      assignedTo,
      search,
      source,
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
 * Controller: Get inquiry by ID
 * Route: GET /api/inquiries/:id
 * Access: Protected (all authenticated users)
 */
export const getInquiryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const inquiry = await inquiryService.getInquiryById(id);

    res.json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update inquiry
 * Route: PATCH /api/inquiries/:id
 * Access: Protected (all authenticated users)
 */
export const updateInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const inquiry = await inquiryService.updateInquiry(id, updateData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Inquiry updated successfully",
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Assign inquiry to a user
 * Route: POST /api/inquiries/:id/assign
 * Access: Protected (authenticated users)
 */
export const assignInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const userId = req.user.id;

    const inquiry = await inquiryService.assignInquiry(id, assignedTo, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Inquiry assigned successfully",
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Convert inquiry to lead with optional service requests
 * Route: POST /api/inquiries/:id/convert-to-lead
 * Access: Protected (authenticated users)
 */
export const convertInquiryToLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const data = req.body; // { serviceRequests: [] }

    const lead = await inquiryService.convertInquiryToLead(
      id,
      userId,
      data,
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    res.status(201).json({
      success: true,
      message: "Inquiry converted to lead successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete inquiry
 * Route: DELETE /api/inquiries/:id
 * Access: Protected (admin, manager only)
 */
export const deleteInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await inquiryService.deleteInquiry(id, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Inquiry deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
