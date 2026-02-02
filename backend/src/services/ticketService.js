import { db } from "../db/index.js";
import {
  clientTicketsTable,
  ticketAttachmentsTable,
  ticketCommentsTable,
  activityLogTable,
  userTable,
} from "../db/schema.js";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";
import counterService from "./counterService.js";

/**
 * TicketService - Business logic for client ticket operations
 * Follows: Route → Controller → Service → DB architecture
 */
class TicketService {
  /**
   * Create a new ticket
   * @param {Object} ticketData - Ticket data
   * @param {string} userId - User creating the ticket (Sales)
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Created ticket
   */
  async createTicket(ticketData, userId, metadata = {}) {
    const { clientId, category, priority, subject, description } = ticketData;

    // Generate ticket number (format: TKT-YYYYMMDD-NNNN)
    const ticketNumber = await counterService.getNextTicketNumber();

    // Create ticket
    const [ticket] = await db
      .insert(clientTicketsTable)
      .values({
        ticketNumber,
        clientId,
        category,
        priority,
        subject,
        description,
        status: "open",
        createdBy: userId,
      })
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "ticket_created",
      entityType: "ticket",
      entityId: ticket.id,
      details: {
        clientId,
        category,
        priority,
        ticketNumber,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return ticket;
  }

  /**
   * Get all tickets with filtering
   * @param {Object} options - Query options
   * @param {string} userId - Current user ID
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @returns {Promise<Array>} Tickets array
   */
  async getAllTickets(options = {}, userId, userRole, isMasterSales) {
    const { clientId, status, category, priority, createdBy } = options;

    // Build where conditions
    const conditions = [];

    if (clientId) {
      conditions.push(eq(clientTicketsTable.clientId, clientId));
    }

    if (status) {
      conditions.push(eq(clientTicketsTable.status, status));
    }

    if (category) {
      conditions.push(eq(clientTicketsTable.category, category));
    }

    if (priority) {
      conditions.push(eq(clientTicketsTable.priority, priority));
    }

    // Permission filtering
    if (userRole === "sales" && !isMasterSales) {
      // Regular sales can only see their own tickets
      conditions.push(eq(clientTicketsTable.createdBy, userId));
    } else if (createdBy) {
      // Admin or master sales can filter by createdBy
      conditions.push(eq(clientTicketsTable.createdBy, createdBy));
    }

    // Query tickets
    const tickets = await db
      .select({
        id: clientTicketsTable.id,
        ticketNumber: clientTicketsTable.ticketNumber,
        clientId: clientTicketsTable.clientId,
        category: clientTicketsTable.category,
        priority: clientTicketsTable.priority,
        subject: clientTicketsTable.subject,
        description: clientTicketsTable.description,
        status: clientTicketsTable.status,
        createdBy: clientTicketsTable.createdBy,
        resolvedBy: clientTicketsTable.resolvedBy,
        resolvedAt: clientTicketsTable.resolvedAt,
        resolutionNotes: clientTicketsTable.resolutionNotes,
        createdAt: clientTicketsTable.createdAt,
        updatedAt: clientTicketsTable.updatedAt,
        // Join creator info
        creatorFirstName: userTable.firstName,
        creatorLastName: userTable.lastName,
        creatorEmail: userTable.email,
      })
      .from(clientTicketsTable)
      .leftJoin(userTable, eq(clientTicketsTable.createdBy, userTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(clientTicketsTable.createdAt));

    return tickets;
  }

  /**
   * Get ticket by ID
   * @param {string} ticketId - Ticket ID
   * @param {string} userId - Current user ID
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @returns {Promise<Object>} Ticket details
   */
  async getTicketById(ticketId, userId, userRole, isMasterSales) {
    const [ticket] = await db
      .select({
        id: clientTicketsTable.id,
        ticketNumber: clientTicketsTable.ticketNumber,
        clientId: clientTicketsTable.clientId,
        category: clientTicketsTable.category,
        priority: clientTicketsTable.priority,
        subject: clientTicketsTable.subject,
        description: clientTicketsTable.description,
        status: clientTicketsTable.status,
        createdBy: clientTicketsTable.createdBy,
        resolvedBy: clientTicketsTable.resolvedBy,
        resolvedAt: clientTicketsTable.resolvedAt,
        resolutionNotes: clientTicketsTable.resolutionNotes,
        createdAt: clientTicketsTable.createdAt,
        updatedAt: clientTicketsTable.updatedAt,
        // Join creator info
        creatorFirstName: userTable.firstName,
        creatorLastName: userTable.lastName,
        creatorEmail: userTable.email,
      })
      .from(clientTicketsTable)
      .leftJoin(userTable, eq(clientTicketsTable.createdBy, userTable.id))
      .where(eq(clientTicketsTable.id, ticketId));

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    // Permission check - regular sales can only view their own tickets
    if (
      userRole === "sales" &&
      !isMasterSales &&
      ticket.createdBy !== userId
    ) {
      throw new AppError("You don't have permission to view this ticket", 403);
    }

    // Get attachments
    const attachments = await db
      .select()
      .from(ticketAttachmentsTable)
      .where(eq(ticketAttachmentsTable.ticketId, ticketId))
      .orderBy(desc(ticketAttachmentsTable.createdAt));

    // Get comments
    const comments = await db
      .select({
        id: ticketCommentsTable.id,
        ticketId: ticketCommentsTable.ticketId,
        content: ticketCommentsTable.content,
        createdBy: ticketCommentsTable.createdBy,
        createdAt: ticketCommentsTable.createdAt,
        // Join user info
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
        role: userTable.role,
      })
      .from(ticketCommentsTable)
      .leftJoin(userTable, eq(ticketCommentsTable.createdBy, userTable.id))
      .where(eq(ticketCommentsTable.ticketId, ticketId))
      .orderBy(ticketCommentsTable.createdAt);

    return {
      ...ticket,
      attachments,
      comments,
    };
  }

  /**
   * Update ticket status (Admin only)
   * @param {string} ticketId - Ticket ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User updating the ticket (Admin)
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated ticket
   */
  async updateTicketStatus(ticketId, updateData, userId, metadata = {}) {
    const { status, resolutionNotes } = updateData;

    // Get existing ticket
    const [existingTicket] = await db
      .select()
      .from(clientTicketsTable)
      .where(eq(clientTicketsTable.id, ticketId));

    if (!existingTicket) {
      throw new AppError("Ticket not found", 404);
    }

    // Prepare update values
    const updateValues = {
      status,
      updatedAt: new Date(),
    };

    // If resolving or closing, set resolution details
    if (status === "resolved" || status === "closed") {
      updateValues.resolvedBy = userId;
      updateValues.resolvedAt = new Date();
      if (resolutionNotes) {
        updateValues.resolutionNotes = resolutionNotes;
      }
    }

    // Update ticket
    const [updatedTicket] = await db
      .update(clientTicketsTable)
      .set(updateValues)
      .where(eq(clientTicketsTable.id, ticketId))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "ticket_status_updated",
      entityType: "ticket",
      entityId: ticketId,
      details: {
        oldStatus: existingTicket.status,
        newStatus: status,
        ticketNumber: existingTicket.ticketNumber,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedTicket;
  }

  /**
   * Add comment to ticket
   * @param {string} ticketId - Ticket ID
   * @param {string} content - Comment content
   * @param {string} userId - User adding comment
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Created comment
   */
  async addComment(ticketId, content, userId, userRole, isMasterSales, metadata = {}) {
    // Get existing ticket
    const [ticket] = await db
      .select()
      .from(clientTicketsTable)
      .where(eq(clientTicketsTable.id, ticketId));

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    // Permission check - regular sales can only comment on their own tickets
    if (
      userRole === "sales" &&
      !isMasterSales &&
      ticket.createdBy !== userId
    ) {
      throw new AppError(
        "You don't have permission to comment on this ticket",
        403
      );
    }

    // Create comment
    const [comment] = await db
      .insert(ticketCommentsTable)
      .values({
        ticketId,
        content,
        createdBy: userId,
      })
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "ticket_comment_added",
      entityType: "ticket",
      entityId: ticketId,
      details: {
        commentId: comment.id,
        ticketNumber: ticket.ticketNumber,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return comment;
  }

  /**
   * Add attachment to ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} attachmentData - Attachment data
   * @param {string} userId - User uploading attachment
   * @returns {Promise<Object>} Created attachment
   */
  async addAttachment(ticketId, attachmentData, userId) {
    const { fileName, fileUrl, fileSize, fileType } = attachmentData;

    // Get existing ticket
    const [ticket] = await db
      .select()
      .from(clientTicketsTable)
      .where(eq(clientTicketsTable.id, ticketId));

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    // Create attachment
    const [attachment] = await db
      .insert(ticketAttachmentsTable)
      .values({
        ticketId,
        fileName,
        fileUrl,
        fileSize,
        fileType,
        uploadedBy: userId,
      })
      .returning();

    return attachment;
  }

  /**
   * Log activity
   * @param {Object} activityData - Activity log data
   */
  async logActivity(activityData) {
    const { userId, action, entityType, entityId, details, ipAddress, userAgent } =
      activityData;

    await db.insert(activityLogTable).values({
      userId,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
    });
  }
}

export default new TicketService();
