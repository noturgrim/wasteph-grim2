import { db } from "../db/index.js";
import { clientNotesTable, activityLogTable, userTable } from "../db/schema.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";

/**
 * ClientNotesService - Business logic for client notes operations
 * Follows: Route → Controller → Service → DB architecture
 */
class ClientNotesService {
  /**
   * Create a new client note
   * @param {Object} noteData - Note data
   * @param {string} userId - User creating the note (Sales)
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Created note
   */
  async createNote(noteData, userId, metadata = {}) {
    const { clientId, interactionType, subject, content, interactionDate } =
      noteData;

    // Create note
    const [note] = await db
      .insert(clientNotesTable)
      .values({
        clientId,
        interactionType,
        subject,
        content,
        interactionDate: new Date(interactionDate),
        createdBy: userId,
      })
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "client_note_created",
      entityType: "client_note",
      entityId: note.id,
      details: {
        clientId,
        interactionType,
        subject,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return note;
  }

  /**
   * Get all notes with filtering
   * @param {Object} options - Query options
   * @param {string} userId - Current user ID
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @returns {Promise<Array>} Notes array
   */
  async getAllNotes(options = {}, userId, userRole, isMasterSales) {
    const { clientId, interactionType, startDate, endDate } = options;

    // Build where conditions
    const conditions = [];

    if (clientId) {
      conditions.push(eq(clientNotesTable.clientId, clientId));
    }

    if (interactionType) {
      conditions.push(eq(clientNotesTable.interactionType, interactionType));
    }

    if (startDate) {
      conditions.push(
        gte(clientNotesTable.interactionDate, new Date(startDate))
      );
    }

    if (endDate) {
      conditions.push(lte(clientNotesTable.interactionDate, new Date(endDate)));
    }

    // Permission filtering - notes are only visible to sales, master sales, and admin
    if (userRole === "sales" && !isMasterSales) {
      // Regular sales can only see their own notes
      conditions.push(eq(clientNotesTable.createdBy, userId));
    }

    // Query notes
    const notes = await db
      .select({
        id: clientNotesTable.id,
        clientId: clientNotesTable.clientId,
        interactionType: clientNotesTable.interactionType,
        subject: clientNotesTable.subject,
        content: clientNotesTable.content,
        interactionDate: clientNotesTable.interactionDate,
        createdBy: clientNotesTable.createdBy,
        createdAt: clientNotesTable.createdAt,
        updatedAt: clientNotesTable.updatedAt,
        // Join creator info
        creatorFirstName: userTable.firstName,
        creatorLastName: userTable.lastName,
        creatorEmail: userTable.email,
      })
      .from(clientNotesTable)
      .leftJoin(userTable, eq(clientNotesTable.createdBy, userTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(clientNotesTable.interactionDate));

    return notes;
  }

  /**
   * Get note by ID
   * @param {string} noteId - Note ID
   * @param {string} userId - Current user ID
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @returns {Promise<Object>} Note details
   */
  async getNoteById(noteId, userId, userRole, isMasterSales) {
    const [note] = await db
      .select({
        id: clientNotesTable.id,
        clientId: clientNotesTable.clientId,
        interactionType: clientNotesTable.interactionType,
        subject: clientNotesTable.subject,
        content: clientNotesTable.content,
        interactionDate: clientNotesTable.interactionDate,
        createdBy: clientNotesTable.createdBy,
        createdAt: clientNotesTable.createdAt,
        updatedAt: clientNotesTable.updatedAt,
        // Join creator info
        creatorFirstName: userTable.firstName,
        creatorLastName: userTable.lastName,
        creatorEmail: userTable.email,
      })
      .from(clientNotesTable)
      .leftJoin(userTable, eq(clientNotesTable.createdBy, userTable.id))
      .where(eq(clientNotesTable.id, noteId));

    if (!note) {
      throw new AppError("Note not found", 404);
    }

    // Permission check - regular sales can only view their own notes
    if (userRole === "sales" && !isMasterSales && note.createdBy !== userId) {
      throw new AppError("You don't have permission to view this note", 403);
    }

    return note;
  }

  /**
   * Update client note
   * @param {string} noteId - Note ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User updating the note
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated note
   */
  async updateNote(
    noteId,
    updateData,
    userId,
    userRole,
    isMasterSales,
    metadata = {}
  ) {
    // Get existing note
    const [existingNote] = await db
      .select()
      .from(clientNotesTable)
      .where(eq(clientNotesTable.id, noteId));

    if (!existingNote) {
      throw new AppError("Note not found", 404);
    }

    // Permission check - only the creator can update their note (or admin/master sales)
    if (
      userRole === "sales" &&
      !isMasterSales &&
      existingNote.createdBy !== userId
    ) {
      throw new AppError("You don't have permission to update this note", 403);
    }

    // Prepare update values
    const updateValues = {
      ...updateData,
      updatedAt: new Date(),
    };

    if (updateData.interactionDate) {
      updateValues.interactionDate = new Date(updateData.interactionDate);
    }

    // Update note
    const [updatedNote] = await db
      .update(clientNotesTable)
      .set(updateValues)
      .where(eq(clientNotesTable.id, noteId))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "client_note_updated",
      entityType: "client_note",
      entityId: noteId,
      details: {
        clientId: existingNote.clientId,
        updatedFields: Object.keys(updateData),
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedNote;
  }

  /**
   * Delete client note
   * @param {string} noteId - Note ID
   * @param {string} userId - User deleting the note
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @param {Object} metadata - Request metadata
   * @returns {Promise<void>}
   */
  async deleteNote(noteId, userId, userRole, isMasterSales, metadata = {}) {
    // Get existing note
    const [existingNote] = await db
      .select()
      .from(clientNotesTable)
      .where(eq(clientNotesTable.id, noteId));

    if (!existingNote) {
      throw new AppError("Note not found", 404);
    }

    // Permission check - only the creator can delete their note (or admin/master sales)
    if (
      userRole === "sales" &&
      !isMasterSales &&
      existingNote.createdBy !== userId
    ) {
      throw new AppError("You don't have permission to delete this note", 403);
    }

    // Delete note
    await db.delete(clientNotesTable).where(eq(clientNotesTable.id, noteId));

    // Log activity
    await this.logActivity({
      userId,
      action: "client_note_deleted",
      entityType: "client_note",
      entityId: noteId,
      details: {
        clientId: existingNote.clientId,
        subject: existingNote.subject,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  }

  /**
   * Get notes timeline for a client
   * @param {string} clientId - Client ID
   * @param {string} userId - Current user ID
   * @param {string} userRole - Current user role
   * @param {boolean} isMasterSales - Is user master sales
   * @returns {Promise<Array>} Notes timeline
   */
  async getClientTimeline(clientId, userId, userRole, isMasterSales) {
    return await this.getAllNotes(
      { clientId },
      userId,
      userRole,
      isMasterSales
    );
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

export default new ClientNotesService();
