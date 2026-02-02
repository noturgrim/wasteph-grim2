import ticketService from "../services/ticketService.js";

/**
 * Controller: Create ticket
 * Route: POST /api/tickets
 * Access: Protected (sales, master_sales, admin)
 */
export const createTicket = async (req, res, next) => {
  try {
    const ticketData = req.body;
    const userId = req.user.id;

    const ticket = await ticketService.createTicket(ticketData, userId, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all tickets
 * Route: GET /api/tickets
 * Access: Protected (sales, master_sales, admin)
 */
export const getAllTickets = async (req, res, next) => {
  try {
    const options = {
      clientId: req.query.clientId,
      status: req.query.status,
      category: req.query.category,
      priority: req.query.priority,
      createdBy: req.query.createdBy,
    };

    const userId = req.user.id;
    const userRole = req.user.role;
    const isMasterSales = req.user.isMasterSales;

    const tickets = await ticketService.getAllTickets(
      options,
      userId,
      userRole,
      isMasterSales
    );

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get ticket by ID
 * Route: GET /api/tickets/:id
 * Access: Protected (sales, master_sales, admin)
 */
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const isMasterSales = req.user.isMasterSales;

    const ticket = await ticketService.getTicketById(
      id,
      userId,
      userRole,
      isMasterSales
    );

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update ticket status
 * Route: PATCH /api/tickets/:id/status
 * Access: Protected (admin only)
 */
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const ticket = await ticketService.updateTicketStatus(
      id,
      updateData,
      userId,
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    res.json({
      success: true,
      message: "Ticket status updated successfully",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Add comment to ticket
 * Route: POST /api/tickets/:id/comments
 * Access: Protected (sales, master_sales, admin)
 */
export const addTicketComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const isMasterSales = req.user.isMasterSales;

    const comment = await ticketService.addComment(
      id,
      content,
      userId,
      userRole,
      isMasterSales,
      {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Add attachment to ticket
 * Route: POST /api/tickets/:id/attachments
 * Access: Protected (sales, master_sales, admin)
 */
export const addTicketAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // File is uploaded via multer middleware
    // S3 upload is handled in the route/middleware
    const attachmentData = {
      fileName: req.body.fileName || req.file.originalname,
      fileUrl: req.body.fileUrl, // S3 key after upload
      fileSize: req.file.size,
      fileType: req.file.mimetype,
    };

    const attachment = await ticketService.addAttachment(
      id,
      attachmentData,
      userId
    );

    res.status(201).json({
      success: true,
      message: "Attachment uploaded successfully",
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
};
