import InquiryService from "../services/inquiryService.js";

// Initialize service
const inquiryService = new InquiryService();

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
 * Controller: Get all inquiries (with optional filters)
 * Route: GET /api/inquiries
 * Access: Protected (all authenticated users)
 */
export const getAllInquiries = async (req, res, next) => {
  try {
    const { status, assignedTo, search, source } = req.query;

    // Check if any filters are provided
    const hasFilters = status || assignedTo || search || source;

    const inquiries = hasFilters
      ? await inquiryService.getAllInquiriesFiltered({ status, assignedTo, search, source })
      : await inquiryService.getAllInquiries();

    res.json({
      success: true,
      data: inquiries,
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
 * Controller: Convert inquiry to lead
 * Route: POST /api/inquiries/:id/convert-to-lead
 * Access: Protected (authenticated users)
 */
export const convertInquiryToLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const lead = await inquiryService.convertInquiryToLead(id, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

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
