import { db } from "../db/index.js";
import { inquiryNotesTable, userTable } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";

class InquiryNotesService {
  /**
   * Add a new note to an inquiry
   * @param {string} inquiryId - Inquiry UUID
   * @param {string} content - Note content
   * @param {string} userId - User creating the note
   * @returns {Promise<Object>} Created note with user information
   */
  async addNote(inquiryId, content, userId) {
    if (!content || content.trim() === "") {
      throw new AppError("Note content cannot be empty", 400);
    }

    const [note] = await db
      .insert(inquiryNotesTable)
      .values({
        inquiryId,
        content: content.trim(),
        createdBy: userId,
      })
      .returning();

    // Fetch user information for the created note
    const noteWithUser = await this.getNoteById(note.id);

    return noteWithUser;
  }

  /**
   * Get a single note by ID with user information
   * @param {string} noteId - Note UUID
   * @returns {Promise<Object>} Note with user information
   */
  async getNoteById(noteId) {
    const [note] = await db
      .select({
        id: inquiryNotesTable.id,
        inquiryId: inquiryNotesTable.inquiryId,
        content: inquiryNotesTable.content,
        createdAt: inquiryNotesTable.createdAt,
        createdBy: {
          id: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
        },
      })
      .from(inquiryNotesTable)
      .leftJoin(userTable, eq(inquiryNotesTable.createdBy, userTable.id))
      .where(eq(inquiryNotesTable.id, noteId));

    if (!note) {
      throw new AppError("Note not found", 404);
    }

    return note;
  }

  /**
   * Get all notes for an inquiry
   * @param {string} inquiryId - Inquiry UUID
   * @returns {Promise<Array>} Array of notes with user information, sorted newest first
   */
  async getNotesByInquiry(inquiryId) {
    const notes = await db
      .select({
        id: inquiryNotesTable.id,
        inquiryId: inquiryNotesTable.inquiryId,
        content: inquiryNotesTable.content,
        createdAt: inquiryNotesTable.createdAt,
        createdBy: {
          id: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
        },
      })
      .from(inquiryNotesTable)
      .leftJoin(userTable, eq(inquiryNotesTable.createdBy, userTable.id))
      .where(eq(inquiryNotesTable.inquiryId, inquiryId))
      .orderBy(desc(inquiryNotesTable.createdAt));

    return notes;
  }

  /**
   * Get notes count for an inquiry
   * @param {string} inquiryId - Inquiry UUID
   * @returns {Promise<number>} Number of notes
   */
  async getNotesCount(inquiryId) {
    const notes = await db
      .select()
      .from(inquiryNotesTable)
      .where(eq(inquiryNotesTable.inquiryId, inquiryId));

    return notes.length;
  }
}

export default new InquiryNotesService();

