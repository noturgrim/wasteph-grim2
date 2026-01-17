/**
 * Migration Script: Move existing inquiry notes to inquiry_notes table
 * 
 * Run this script after pushing the database schema changes:
 * node backend/src/migrations/migrateInquiryNotes.js
 */

import { db } from "../db/index.js";
import { inquiryTable, inquiryNotesTable } from "../db/schema.js";
import { sql, isNotNull } from "drizzle-orm";

async function migrateInquiryNotes() {
  console.log("Starting inquiry notes migration...");

  try {
    // Get all inquiries that have notes
    const inquiriesWithNotes = await db
      .select({
        id: inquiryTable.id,
        notes: inquiryTable.notes,
        assignedTo: inquiryTable.assignedTo,
        createdAt: inquiryTable.createdAt,
      })
      .from(inquiryTable)
      .where(isNotNull(inquiryTable.notes));

    console.log(`Found ${inquiriesWithNotes.length} inquiries with notes`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const inquiry of inquiriesWithNotes) {
      // Skip empty notes
      if (!inquiry.notes || inquiry.notes.trim() === "") {
        skippedCount++;
        continue;
      }

      // Create a note entry, attributed to the assigned user or a system user
      const createdBy = inquiry.assignedTo || "system";

      try {
        await db.insert(inquiryNotesTable).values({
          inquiryId: inquiry.id,
          content: `[Migrated from legacy notes]\n\n${inquiry.notes}`,
          createdBy,
          createdAt: inquiry.createdAt, // Use the inquiry creation date
        });

        migratedCount++;
        console.log(`✓ Migrated note for inquiry ${inquiry.id}`);
      } catch (error) {
        console.error(`✗ Error migrating note for inquiry ${inquiry.id}:`, error.message);
      }
    }

    console.log("\n=== Migration Complete ===");
    console.log(`Total inquiries with notes: ${inquiriesWithNotes.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (empty): ${skippedCount}`);
    console.log(`Failed: ${inquiriesWithNotes.length - migratedCount - skippedCount}`);

    // Optional: Clear the legacy notes field after successful migration
    // Uncomment the following lines if you want to clear the old notes field
    /*
    console.log("\nClearing legacy notes field...");
    await db
      .update(inquiryTable)
      .set({ notes: null })
      .where(isNotNull(inquiryTable.notes));
    console.log("Legacy notes field cleared");
    */

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migration
migrateInquiryNotes()
  .then(() => {
    console.log("\n✓ Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  });


