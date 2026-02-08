import { db } from "../db/index.js";
import {
  clientTicketsTable,
  ticketAttachmentsTable,
  ticketCommentsTable,
  activityLogTable,
  userTable,
} from "../db/schema.js";
import { eq, desc, and, or, inArray, like, count, sql } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";
import counterService from "./counterService.js";
import { getPresignedUrl } from "./s3Service.js";

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
    const { clientId, status, category, priority, createdBy, search, page: rawPage = 1, limit: rawLimit = 10 } = options;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (clientId) {
      conditions.push(eq(clientTicketsTable.clientId, clientId));
    }

    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      conditions.push(statuses.length === 1
        ? eq(clientTicketsTable.status, statuses[0])
        : inArray(clientTicketsTable.status, statuses));
    }

    if (category) {
      const categories = category.split(",").map((s) => s.trim());
      conditions.push(categories.length === 1
        ? eq(clientTicketsTable.category, categories[0])
        : inArray(clientTicketsTable.category, categories));
    }

    if (priority) {
      const priorities = priority.split(",").map((s) => s.trim());
      conditions.push(priorities.length === 1
        ? eq(clientTicketsTable.priority, priorities[0])
        : inArray(clientTicketsTable.priority, priorities));
    }

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      conditions.push(
        or(
          like(clientTicketsTable.ticketNumber, `%${escaped}%`),
          like(clientTicketsTable.subject, `%${escaped}%`),
          like(userTable.firstName, `%${escaped}%`),
          like(userTable.lastName, `%${escaped}%`),
        ),
      );
    }

    // Permission filtering
    if (userRole === "sales" && !isMasterSales) {
      conditions.push(eq(clientTicketsTable.createdBy, userId));
    } else if (createdBy) {
      conditions.push(eq(clientTicketsTable.createdBy, createdBy));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Single query: data + count via window function
    const rows = await db
      .select({
        id: clientTicketsTable.id,
        ticketNumber: clientTicketsTable.ticketNumber,
        clientId: clientTicketsTable.clientId,
        category: clientTicketsTable.category,
        priority: clientTicketsTable.priority,
        subject: clientTicketsTable.subject,
        status: clientTicketsTable.status,
        createdBy: clientTicketsTable.createdBy,
        resolvedBy: clientTicketsTable.resolvedBy,
        resolvedAt: clientTicketsTable.resolvedAt,
        createdAt: clientTicketsTable.createdAt,
        updatedAt: clientTicketsTable.updatedAt,
        creatorFirstName: userTable.firstName,
        creatorLastName: userTable.lastName,
        creatorEmail: userTable.email,
        totalCount: sql`(count(*) over())::int`,
      })
      .from(clientTicketsTable)
      .leftJoin(userTable, eq(clientTicketsTable.createdBy, userTable.id))
      .where(whereClause)
      .orderBy(desc(clientTicketsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const total = rows.length > 0 ? rows[0].totalCount : 0;

    // Strip totalCount from each row
    const data = rows.map(({ totalCount, ...ticket }) => ticket);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    // Fetch attachments and comments in parallel
    const [attachments, comments] = await Promise.all([
      db
        .select({
          id: ticketAttachmentsTable.id,
          ticketId: ticketAttachmentsTable.ticketId,
          fileName: ticketAttachmentsTable.fileName,
          fileUrl: ticketAttachmentsTable.fileUrl,
          fileSize: ticketAttachmentsTable.fileSize,
          createdAt: ticketAttachmentsTable.createdAt,
        })
        .from(ticketAttachmentsTable)
        .where(eq(ticketAttachmentsTable.ticketId, ticketId))
        .orderBy(desc(ticketAttachmentsTable.createdAt)),
      db
        .select({
          id: ticketCommentsTable.id,
          ticketId: ticketCommentsTable.ticketId,
          content: ticketCommentsTable.content,
          createdBy: ticketCommentsTable.createdBy,
          createdAt: ticketCommentsTable.createdAt,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
          role: userTable.role,
        })
        .from(ticketCommentsTable)
        .leftJoin(userTable, eq(ticketCommentsTable.createdBy, userTable.id))
        .where(eq(ticketCommentsTable.ticketId, ticketId))
        .orderBy(ticketCommentsTable.createdAt),
    ]);

    return {
      ...ticket,
      attachments,
      comments,
    };
  }

  /**
   * Update ticket (subject, description, category, priority, clientId)
   * Sales can edit their own tickets; admin can edit any
   * @param {string} ticketId - Ticket ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User updating the ticket
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated ticket
   */
  async updateTicket(ticketId, updateData, userId, userRole, isMasterSales, metadata = {}) {
    const [existingTicket] = await db
      .select()
      .from(clientTicketsTable)
      .where(eq(clientTicketsTable.id, ticketId));

    if (!existingTicket) {
      throw new AppError("Ticket not found", 404);
    }

    // Permission: sales can edit own tickets; admin/master_sales can edit any
    if (
      userRole === "sales" &&
      !isMasterSales &&
      existingTicket.createdBy !== userId
    ) {
      throw new AppError("You don't have permission to edit this ticket", 403);
    }

    const updateValues = {
      ...Object.fromEntries(
        Object.entries(updateData).filter(([, v]) => v !== undefined)
      ),
      updatedAt: new Date(),
    };

    const [updatedTicket] = await db
      .update(clientTicketsTable)
      .set(updateValues)
      .where(eq(clientTicketsTable.id, ticketId))
      .returning();

    await this.logActivity({
      userId,
      action: "ticket_updated",
      entityType: "ticket",
      entityId: ticketId,
      details: {
        ticketNumber: existingTicket.ticketNumber,
        updatedFields: Object.keys(updateData),
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedTicket;
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
   * Get attachment view URL (presigned S3 URL)
   * @param {string} ticketId - Ticket ID
   * @param {string} attachmentId - Attachment ID
   * @param {string} userId - Current user ID
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @returns {Promise<{ viewUrl: string, fileName: string, fileType: string }>}
   */
  async getAttachmentViewUrl(ticketId, attachmentId, userId, userRole, isMasterSales) {
    const [attachment] = await db
      .select()
      .from(ticketAttachmentsTable)
      .where(
        and(
          eq(ticketAttachmentsTable.id, attachmentId),
          eq(ticketAttachmentsTable.ticketId, ticketId)
        )
      );

    if (!attachment) {
      throw new AppError("Attachment not found", 404);
    }

    const [ticket] = await db
      .select()
      .from(clientTicketsTable)
      .where(eq(clientTicketsTable.id, ticketId));

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    if (userRole === "sales" && !isMasterSales && ticket.createdBy !== userId) {
      throw new AppError("You don't have permission to view this attachment", 403);
    }

    const viewUrl = await getPresignedUrl(attachment.fileUrl, 3600);

    return {
      viewUrl,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
    };
  }

  /**
   * Delete attachment from ticket
   * @param {string} ticketId - Ticket ID
   * @param {string} attachmentId - Attachment ID
   * @param {string} userId - Current user ID
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @returns {Promise<void>}
   */
  async deleteAttachment(ticketId, attachmentId, userId, userRole, isMasterSales) {
    const [attachment] = await db
      .select()
      .from(ticketAttachmentsTable)
      .where(
        and(
          eq(ticketAttachmentsTable.id, attachmentId),
          eq(ticketAttachmentsTable.ticketId, ticketId)
        )
      );

    if (!attachment) {
      throw new AppError("Attachment not found", 404);
    }

    const [ticket] = await db
      .select()
      .from(clientTicketsTable)
      .where(eq(clientTicketsTable.id, ticketId));

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    if (userRole === "sales" && !isMasterSales && ticket.createdBy !== userId) {
      throw new AppError("You don't have permission to delete this attachment", 403);
    }

    await db
      .delete(ticketAttachmentsTable)
      .where(
        and(
          eq(ticketAttachmentsTable.id, attachmentId),
          eq(ticketAttachmentsTable.ticketId, ticketId)
        )
      );

    try {
      const { deleteObject } = await import("./s3Service.js");
      await deleteObject(attachment.fileUrl);
    } catch (s3Err) {
      console.error("S3 delete failed (attachment record removed):", s3Err);
    }
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
