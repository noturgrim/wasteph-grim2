import { db } from "../db/index.js";
import { countersTable } from "../db/schema.js";
import { sql } from "drizzle-orm";

/**
 * CounterService - Generates sequential numbers for entities
 * Format: PREFIX-YYYYMMDD-NNNN (e.g., INQ-20260131-0001, PROP-20260131-0052)
 * Follows the same pattern as Contract/Quotation numbering system
 */
class CounterService {
  /**
   * Generate next sequential number for an entity type
   * Numbers reset daily for easy tracking of daily volume
   *
   * @param {string} entityType - 'inquiry' or 'proposal'
   * @returns {Promise<string>} Formatted number (e.g., INQ-20260131-0001)
   */
  async getNextNumber(entityType) {
    // Get current date in YYYY-MM-DD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`; // YYYY-MM-DD
    const dateFormatted = `${year}${month}${day}`; // YYYYMMDD for display

    try {
      // Atomic increment using PostgreSQL upsert
      // If record exists for this entityType+date: increment counter
      // If not exists: create new record with counter = 1
      const [counter] = await db
        .insert(countersTable)
        .values({
          entityType,
          date,
          currentValue: 1,
        })
        .onConflictDoUpdate({
          target: [countersTable.entityType, countersTable.date],
          set: {
            currentValue: sql`${countersTable.currentValue} + 1`,
            updatedAt: now,
          },
        })
        .returning();

      // Determine prefix based on entity type
      const prefix = entityType === 'inquiry' ? 'INQ' : 'PROP';

      // Pad number to 4 digits (0001, 0002, ..., 9999)
      const paddedNumber = String(counter.currentValue).padStart(4, '0');

      // Return formatted number: PREFIX-YYYYMMDD-NNNN
      return `${prefix}-${dateFormatted}-${paddedNumber}`;
    } catch (error) {
      console.error('Error generating number:', error);
      throw new Error(`Failed to generate ${entityType} number: ${error.message}`);
    }
  }

  /**
   * Generate inquiry number
   * @returns {Promise<string>} Format: INQ-YYYYMMDD-NNNN
   */
  async getNextInquiryNumber() {
    return this.getNextNumber('inquiry');
  }

  /**
   * Generate proposal number
   * @returns {Promise<string>} Format: PROP-YYYYMMDD-NNNN
   */
  async getNextProposalNumber() {
    return this.getNextNumber('proposal');
  }

  /**
   * Get current counter value for a specific date and entity type (for debugging/testing)
   * @param {string} entityType - 'inquiry' or 'proposal'
   * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
   * @returns {Promise<number|null>} Current counter value or null if not exists
   */
  async getCurrentValue(entityType, date = null) {
    if (!date) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      date = `${year}-${month}-${day}`;
    }

    const [counter] = await db
      .select()
      .from(countersTable)
      .where(
        sql`${countersTable.entityType} = ${entityType} AND ${countersTable.date} = ${date}`
      )
      .limit(1);

    return counter ? counter.currentValue : null;
  }
}

export default new CounterService();
