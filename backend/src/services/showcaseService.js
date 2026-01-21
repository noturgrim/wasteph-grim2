import { db } from "../db/index.js";
import { showcaseTable } from "../db/schema.js";
import { eq, desc, and } from "drizzle-orm";

/**
 * Showcase Service
 * Handles business logic for showcase items
 */

class ShowcaseService {
  /**
   * Get all active showcases (public)
   */
  async getActiveShowcases(limit = 6) {
    const showcases = await db
      .select()
      .from(showcaseTable)
      .where(eq(showcaseTable.isActive, true))
      .orderBy(desc(showcaseTable.displayOrder), desc(showcaseTable.createdAt))
      .limit(limit);

    return showcases;
  }

  /**
   * Get all showcases (admin - includes inactive)
   */
  async getAllShowcases() {
    const showcases = await db
      .select()
      .from(showcaseTable)
      .orderBy(desc(showcaseTable.displayOrder), desc(showcaseTable.createdAt));

    return showcases;
  }

  /**
   * Get showcase by ID
   */
  async getShowcaseById(id) {
    const [showcase] = await db
      .select()
      .from(showcaseTable)
      .where(eq(showcaseTable.id, id))
      .limit(1);

    return showcase || null;
  }

  /**
   * Create new showcase
   */
  async createShowcase(showcaseData, userId) {
    const [showcase] = await db
      .insert(showcaseTable)
      .values({
        ...showcaseData,
        createdBy: userId,
      })
      .returning();

    return showcase;
  }

  /**
   * Update showcase
   */
  async updateShowcase(id, showcaseData) {
    const [updated] = await db
      .update(showcaseTable)
      .set({
        ...showcaseData,
        updatedAt: new Date(),
      })
      .where(eq(showcaseTable.id, id))
      .returning();

    return updated;
  }

  /**
   * Delete showcase
   */
  async deleteShowcase(id) {
    const [deleted] = await db
      .delete(showcaseTable)
      .where(eq(showcaseTable.id, id))
      .returning();

    return deleted;
  }

  /**
   * Toggle showcase active status
   */
  async toggleShowcaseStatus(id) {
    const showcase = await this.getShowcaseById(id);
    
    if (!showcase) {
      throw new Error("Showcase not found");
    }

    const [updated] = await db
      .update(showcaseTable)
      .set({
        isActive: !showcase.isActive,
        updatedAt: new Date(),
      })
      .where(eq(showcaseTable.id, id))
      .returning();

    return updated;
  }

  /**
   * Update display order
   */
  async updateDisplayOrder(id, displayOrder) {
    const [updated] = await db
      .update(showcaseTable)
      .set({
        displayOrder,
        updatedAt: new Date(),
      })
      .where(eq(showcaseTable.id, id))
      .returning();

    return updated;
  }
}

export default new ShowcaseService();
