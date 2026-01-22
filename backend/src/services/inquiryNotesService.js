import { db } from "../db/index.js";
import { inquiryNotesTable, userTable, activityLogTable, proposalTable, serviceTable } from "../db/schema.js";
import { eq, desc, and, or } from "drizzle-orm";
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

    // Don't log activity for note creation - the note itself appears in the timeline
    // This avoids duplicate entries in the activity timeline

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

  /**
   * Get unified timeline for an inquiry (notes + activity logs)
   * @param {string} inquiryId - Inquiry UUID
   * @returns {Promise<Array>} Array of timeline entries sorted newest first
   */
  async getInquiryTimeline(inquiryId) {
    // Fetch manual notes
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
      .where(eq(inquiryNotesTable.inquiryId, inquiryId));

    // Get all proposals for this inquiry to include their activities
    const proposals = await db
      .select({ id: proposalTable.id })
      .from(proposalTable)
      .where(eq(proposalTable.inquiryId, inquiryId));

    const proposalIds = proposals.map(p => p.id);

    // Fetch activity logs:
    // 1. Activities for the inquiry itself (entityType = "inquiry")
    // 2. Activities for proposals related to this inquiry (entityType = "proposal")
    const activityConditions = [
      and(
        eq(activityLogTable.entityType, "inquiry"),
        eq(activityLogTable.entityId, inquiryId)
      ),
    ];

    // Add proposal activities if there are any proposals
    if (proposalIds.length > 0) {
      activityConditions.push(
        and(
          eq(activityLogTable.entityType, "proposal"),
          or(...proposalIds.map(id => eq(activityLogTable.entityId, id)))
        )
      );
    }

    const activities = await db
      .select({
        id: activityLogTable.id,
        action: activityLogTable.action,
        details: activityLogTable.details,
        createdAt: activityLogTable.createdAt,
        userId: activityLogTable.userId,
        user: {
          id: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
        },
      })
      .from(activityLogTable)
      .leftJoin(userTable, eq(activityLogTable.userId, userTable.id))
      .where(or(...activityConditions));

    // Fetch service names for service ID lookups (for inquiry_updated activities)
    const services = await db.select().from(serviceTable);
    const serviceMap = {};
    services.forEach(service => {
      serviceMap[service.id] = service.name;
    });

    // Fetch user names for assignedTo lookups
    const users = await db.select().from(userTable);
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = `${user.firstName} ${user.lastName}`;
    });

    // Combine and format timeline entries
    const timeline = [
      // Manual notes
      ...notes.map(note => ({
        id: note.id,
        type: "note",
        content: note.content,
        createdAt: note.createdAt,
        createdBy: note.createdBy,
      })),
      // Activity logs
      ...activities.map(activity => {
        const details = activity.details ? JSON.parse(activity.details) : null;
        
        // Enrich service changes with service names
        if (details?.changes?.serviceId) {
          details.changes.serviceId = {
            from: details.changes.serviceId.from,
            to: details.changes.serviceId.to,
            fromName: serviceMap[details.changes.serviceId.from] || null,
            toName: serviceMap[details.changes.serviceId.to] || null,
          };
        }

        // Enrich assignedTo changes with user names
        if (details?.changes?.assignedTo) {
          details.changes.assignedTo = {
            from: details.changes.assignedTo.from,
            to: details.changes.assignedTo.to,
            fromName: userMap[details.changes.assignedTo.from] || null,
            toName: userMap[details.changes.assignedTo.to] || null,
          };
        }

        return {
          id: activity.id,
          type: "activity",
          action: activity.action,
          details,
          createdAt: activity.createdAt,
          createdBy: activity.user,
        };
      }),
    ];

    // Sort by createdAt (newest first)
    timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return timeline;
  }
}

export default new InquiryNotesService();

