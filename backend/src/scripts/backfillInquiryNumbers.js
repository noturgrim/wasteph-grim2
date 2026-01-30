import { db } from "../db/index.js";
import { inquiryTable, proposalTable } from "../db/schema.js";
import { sql } from "drizzle-orm";
import counterService from "../services/counterService.js";

/**
 * Backfill inquiry numbers for existing inquiries
 * This script assigns inquiry numbers to all inquiries that don't have one
 * Numbers are generated based on the inquiry's creation date
 */

async function backfillInquiryNumbers() {
  console.log("🔄 Starting inquiry number backfill...\n");

  try {
    // Get all inquiries without inquiry numbers, ordered by creation date
    const inquiries = await db
      .select()
      .from(inquiryTable)
      .where(sql`${inquiryTable.inquiryNumber} IS NULL OR ${inquiryTable.inquiryNumber} = ''`)
      .orderBy(inquiryTable.createdAt);

    if (inquiries.length === 0) {
      console.log("✅ No inquiries need backfilling. All inquiries already have numbers!");
      return;
    }

    console.log(`📊 Found ${inquiries.length} inquiries without numbers\n`);

    // Group inquiries by date to maintain sequential numbering per day
    const inquiriesByDate = {};

    for (const inquiry of inquiries) {
      const date = new Date(inquiry.createdAt);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!inquiriesByDate[dateKey]) {
        inquiriesByDate[dateKey] = [];
      }
      inquiriesByDate[dateKey].push(inquiry);
    }

    console.log(`📅 Processing inquiries across ${Object.keys(inquiriesByDate).length} different dates\n`);

    let totalUpdated = 0;

    // Process each date group
    for (const [date, dateInquiries] of Object.entries(inquiriesByDate)) {
      console.log(`\n📆 Processing ${dateInquiries.length} inquiries from ${date}`);

      // Generate numbers for each inquiry on this date
      for (const inquiry of dateInquiries) {
        try {
          // Temporarily set the date for counter service
          const inquiryDate = new Date(inquiry.createdAt);
          const year = inquiryDate.getFullYear();
          const month = String(inquiryDate.getMonth() + 1).padStart(2, '0');
          const day = String(inquiryDate.getDate()).padStart(2, '0');
          const dateFormatted = `${year}${month}${day}`;

          // Get next number for this specific date
          const number = await getNextNumberForDate('inquiry', date);
          const inquiryNumber = `INQ-${dateFormatted}-${String(number).padStart(4, '0')}`;

          // Update the inquiry
          await db
            .update(inquiryTable)
            .set({ inquiryNumber })
            .where(sql`${inquiryTable.id} = ${inquiry.id}`);

          console.log(`  ✓ ${inquiry.name}: ${inquiryNumber}`);
          totalUpdated++;
        } catch (error) {
          console.error(`  ✗ Failed to update inquiry ${inquiry.id}: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Backfill complete! Updated ${totalUpdated} out of ${inquiries.length} inquiries`);

  } catch (error) {
    console.error("\n❌ Error during backfill:", error);
    throw error;
  }
}

/**
 * Get next number for a specific date (for backfilling historical data)
 */
async function getNextNumberForDate(entityType, date) {
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
        updatedAt: new Date(),
      },
    })
    .returning();

  return counter.currentValue;
}

/**
 * Backfill proposal numbers for existing proposals
 */
async function backfillProposalNumbers() {
  console.log("\n\n🔄 Starting proposal number backfill...\n");

  try {
    const proposals = await db
      .select()
      .from(proposalTable)
      .where(sql`${proposalTable.proposalNumber} IS NULL OR ${proposalTable.proposalNumber} = ''`)
      .orderBy(proposalTable.createdAt);

    if (proposals.length === 0) {
      console.log("✅ No proposals need backfilling. All proposals already have numbers!");
      return;
    }

    console.log(`📊 Found ${proposals.length} proposals without numbers\n`);

    const proposalsByDate = {};

    for (const proposal of proposals) {
      const date = new Date(proposal.createdAt);
      const dateKey = date.toISOString().split('T')[0];

      if (!proposalsByDate[dateKey]) {
        proposalsByDate[dateKey] = [];
      }
      proposalsByDate[dateKey].push(proposal);
    }

    console.log(`📅 Processing proposals across ${Object.keys(proposalsByDate).length} different dates\n`);

    let totalUpdated = 0;

    for (const [date, dateProposals] of Object.entries(proposalsByDate)) {
      console.log(`\n📆 Processing ${dateProposals.length} proposals from ${date}`);

      for (const proposal of dateProposals) {
        try {
          const proposalDate = new Date(proposal.createdAt);
          const year = proposalDate.getFullYear();
          const month = String(proposalDate.getMonth() + 1).padStart(2, '0');
          const day = String(proposalDate.getDate()).padStart(2, '0');
          const dateFormatted = `${year}${month}${day}`;

          const number = await getNextNumberForDate('proposal', date);
          const proposalNumber = `PROP-${dateFormatted}-${String(number).padStart(4, '0')}`;

          await db
            .update(proposalTable)
            .set({ proposalNumber })
            .where(sql`${proposalTable.id} = ${proposal.id}`);

          console.log(`  ✓ Proposal ${proposal.id.substring(0, 8)}: ${proposalNumber}`);
          totalUpdated++;
        } catch (error) {
          console.error(`  ✗ Failed to update proposal ${proposal.id}: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Backfill complete! Updated ${totalUpdated} out of ${proposals.length} proposals`);

  } catch (error) {
    console.error("\n❌ Error during proposal backfill:", error);
    throw error;
  }
}

// Import counters table
import { countersTable } from "../db/schema.js";

// Run both backfills
async function main() {
  console.log("========================================");
  console.log("   INQUIRY & PROPOSAL NUMBER BACKFILL   ");
  console.log("========================================\n");

  try {
    await backfillInquiryNumbers();
    await backfillProposalNumbers();

    console.log("\n========================================");
    console.log("         BACKFILL COMPLETE! ✅          ");
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Backfill failed:", error);
    process.exit(1);
  }
}

main();
