import { db } from "../db/index.js";
import {
  clientTicketsTable,
  ticketAttachmentsTable,
  ticketCommentsTable,
  activityLogTable,
  userTable,
  contractsTable,
  clientTable,
} from "../db/schema.js";
import { eq, desc, and, or, inArray, like, count, sql } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";
import counterService from "./counterService.js";
import { getPresignedUrl } from "./s3Service.js";
import socketServer from "../socket/socketServer.js";
import TicketEventEmitter from "../socket/events/ticketEvents.js";
import emailService from "./emailService.js";

/**
 * TicketService with Real-Time Socket Support
 * Follows: Route → Controller → Service → DB architecture
 * Emits socket events for real-time updates
 */
class TicketService {
  constructor() {
    // Initialize ticket event emitter (will be set after socket server is ready)
    this.ticketEvents = null;
  }

  /**
   * Initialize socket event emitter
   * Called after socket server is initialized
   */
  initializeSocketEvents() {
    this.ticketEvents = new TicketEventEmitter(socketServer);
  }

  /**
   * Create a new ticket
   * @param {Object} ticketData - Ticket data
   * @param {string} userId - User creating the ticket (Sales)
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Created ticket
   */
  async createTicket(ticketData, userId, metadata = {}) {
    const { clientId, contractId, category, priority, subject, description } = ticketData;

    // Generate ticket number (format: TKT-YYYYMMDD-NNNN)
    const ticketNumber = await counterService.getNextTicketNumber();

    // Create ticket
    const [ticket] = await db
      .insert(clientTicketsTable)
      .values({
        ticketNumber,
        clientId,
        contractId: contractId || null,
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
        contractId: contractId || null,
        category,
        priority,
        ticketNumber,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    // Get ticket details for notifications
    const [fullTicket] = await db
      .select({
        id: clientTicketsTable.id,
        ticketNumber: clientTicketsTable.ticketNumber,
        clientId: clientTicketsTable.clientId,
        category: clientTicketsTable.category,
        priority: clientTicketsTable.priority,
        subject: clientTicketsTable.subject,
        description: clientTicketsTable.description,
        contractId: clientTicketsTable.contractId,
        contractNumber: contractsTable.contractNumber,
        clientName: clientTable.contactPerson,
        companyName: clientTable.companyName,
        creatorFirstName: userTable.firstName,
        creatorLastName: userTable.lastName,
        creatorEmail: userTable.email,
      })
      .from(clientTicketsTable)
      .leftJoin(userTable, eq(clientTicketsTable.createdBy, userTable.id))
      .leftJoin(contractsTable, eq(clientTicketsTable.contractId, contractsTable.id))
      .leftJoin(clientTable, eq(clientTicketsTable.clientId, clientTable.id))
      .where(eq(clientTicketsTable.id, ticket.id));

    // Emit socket event
    if (this.ticketEvents && fullTicket) {
      const user = {
        id: fullTicket.creatorEmail ? userId : null,
        firstName: fullTicket.creatorFirstName,
        lastName: fullTicket.creatorLastName,
        email: fullTicket.creatorEmail,
        role: "sales",
      };
      if (user.id) {
        await this.ticketEvents.emitTicketCreated(ticket, user);
      }
    }

    // Send email notifications to all admins
    if (fullTicket) {
      const adminUsers = await db
        .select({
          email: userTable.email,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
        })
        .from(userTable)
        .where(
          and(
            inArray(userTable.role, ["admin", "super_admin"]),
            eq(userTable.isActive, true)
          )
        );

      const emailData = {
        ticketNumber: fullTicket.ticketNumber,
        ticketId: fullTicket.id,
        clientName: fullTicket.clientName,
        companyName: fullTicket.companyName,
        category: fullTicket.category,
        priority: fullTicket.priority,
        subject: fullTicket.subject,
        description: fullTicket.description,
        creatorName: `${fullTicket.creatorFirstName} ${fullTicket.creatorLastName}`,
        contractNumber: fullTicket.contractNumber,
      };

      // Send emails to all admins (fire and forget)
      adminUsers.forEach((admin) => {
        emailService
          .sendNewTicketNotification(admin.email, emailData)
          .catch((err) =>
            console.error(`Failed to send ticket notification to ${admin.email}:`, err.message)
          );
      });
    }

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

    // Permission filter for facets
    const permissionFilter =
      userRole === "sales" && !isMasterSales
        ? sql`created_by = ${userId}`
        : sql`1=1`;

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
      conditions.push(
        or(
          like(clientTicketsTable.ticketNumber, `%${search}%`),
          like(clientTicketsTable.subject, `%${search}%`),
          like(clientTicketsTable.description, `%${search}%`),
          like(userTable.firstName, `%${search}%`),
          like(userTable.lastName, `%${search}%`),
        )
      );
    }

    // Permission filtering
    if (userRole === "sales" && !isMasterSales) {
      conditions.push(eq(clientTicketsTable.createdBy, userId));
    } else if (createdBy) {
      conditions.push(eq(clientTicketsTable.createdBy, createdBy));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Run count, data, and facets in parallel
    const [[{ value: total }], tickets, facetRows] = await Promise.all([
      // 1. Total count
      db
        .select({ value: count() })
        .from(clientTicketsTable)
        .leftJoin(userTable, eq(clientTicketsTable.createdBy, userTable.id))
        .where(whereClause),

      // 2. Paginated data
      db
        .select({
          id: clientTicketsTable.id,
          ticketNumber: clientTicketsTable.ticketNumber,
          clientId: clientTicketsTable.clientId,
          contractId: clientTicketsTable.contractId,
          contractNumber: contractsTable.contractNumber,
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
          creatorFirstName: userTable.firstName,
          creatorLastName: userTable.lastName,
          creatorEmail: userTable.email,
        })
        .from(clientTicketsTable)
        .leftJoin(userTable, eq(clientTicketsTable.createdBy, userTable.id))
        .leftJoin(contractsTable, eq(clientTicketsTable.contractId, contractsTable.id))
        .where(whereClause)
        .orderBy(desc(clientTicketsTable.createdAt))
        .limit(limit)
        .offset(offset),

      // 3. All 3 facets in one query via UNION ALL (permission-filtered, NOT filter-filtered)
      db.execute(sql`
        SELECT 'status'::text AS facet_type, status::text AS facet_value, count(*)::int AS cnt
          FROM client_tickets WHERE ${permissionFilter} GROUP BY status
        UNION ALL
        SELECT 'category'::text, category::text, count(*)::int
          FROM client_tickets WHERE ${permissionFilter} GROUP BY category
        UNION ALL
        SELECT 'priority'::text, priority::text, count(*)::int
          FROM client_tickets WHERE ${permissionFilter} GROUP BY priority
      `),
    ]);

    // Parse combined UNION ALL facet rows into maps
    const facets = { status: {}, category: {}, priority: {} };
    for (const row of facetRows) {
      if (!row.facet_value) continue;
      if (row.facet_type === "status") facets.status[row.facet_value] = row.cnt;
      else if (row.facet_type === "category") facets.category[row.facet_value] = row.cnt;
      else if (row.facet_type === "priority") facets.priority[row.facet_value] = row.cnt;
    }

    return {
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      facets,
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
        contractId: clientTicketsTable.contractId,
        contractNumber: contractsTable.contractNumber,
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
      .leftJoin(contractsTable, eq(clientTicketsTable.contractId, contractsTable.id))
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

    // Emit socket event for updates
    if (this.ticketEvents) {
      // Check if priority changed
      if (updateData.priority && updateData.priority !== existingTicket.priority) {
        this.ticketEvents.emitTicketPriorityChanged(
          updatedTicket,
          existingTicket.priority,
          updateData.priority,
          userId
        );
      } else {
        this.ticketEvents.emitTicketUpdated(updatedTicket, updateData, userId);
      }
    }

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

    // Emit socket event
    if (this.ticketEvents) {
      this.ticketEvents.emitTicketStatusChanged(
        updatedTicket,
        existingTicket.status,
        status,
        userId
      );
    }

    // Send email notification to the sales person who created the ticket
    const [creator] = await db
      .select({
        email: userTable.email,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
      })
      .from(userTable)
      .where(eq(userTable.id, existingTicket.createdBy));

    if (creator && creator.email) {
      const emailData = {
        ticketNumber: existingTicket.ticketNumber,
        ticketId: existingTicket.id,
        updateType: "status",
        subject: existingTicket.subject,
        oldStatus: existingTicket.status,
        newStatus: status,
        resolutionNotes: resolutionNotes || null,
      };

      emailService
        .sendTicketUpdateNotification(creator.email, emailData)
        .catch((err) =>
          console.error(`Failed to send ticket update notification to ${creator.email}:`, err.message)
        );
    }

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

    // Get user info for socket event
    const [user] = await db
      .select({
        id: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
        role: userTable.role,
      })
      .from(userTable)
      .where(eq(userTable.id, userId));

    // Emit socket event
    if (this.ticketEvents && user) {
      await this.ticketEvents.emitCommentAdded(comment, ticket, user);
    }

    // Send email notification to ticket creator if comment is from admin/super_admin
    if (
      user &&
      (user.role === "admin" || user.role === "super_admin") &&
      ticket.createdBy !== userId
    ) {
      const [creator] = await db
        .select({
          email: userTable.email,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
        })
        .from(userTable)
        .where(eq(userTable.id, ticket.createdBy));

      if (creator && creator.email) {
        const emailData = {
          ticketNumber: ticket.ticketNumber,
          ticketId: ticket.id,
          updateType: "comment",
          subject: ticket.subject,
          commentText: content,
          commentAuthor: `${user.firstName} ${user.lastName}`,
        };

        emailService
          .sendTicketUpdateNotification(creator.email, emailData)
          .catch((err) =>
            console.error(
              `Failed to send comment notification to ${creator.email}:`,
              err.message
            )
          );
      }
    }

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

    // Emit socket event
    if (this.ticketEvents) {
      this.ticketEvents.emitAttachmentAdded(attachment, ticket, userId);
    }

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

    // Emit socket event
    if (this.ticketEvents) {
      this.ticketEvents.emitAttachmentDeleted(attachmentId, ticket, userId);
    }

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
