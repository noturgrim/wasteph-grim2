import { db } from "../db/index.js";
import {
  userTable,
  leadTable,
  clientTable,
  inquiryTable,
} from "../db/schema.js";
import { like, or } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const cleanupLoadTestData = async (dryRun = false) => {
  try {
    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    if (dryRun) {
      console.log("  LOAD TEST DATA CLEANUP - DRY RUN (Preview Only)");
    } else {
      console.log("  LOAD TEST DATA CLEANUP");
    }
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");

    let counts = {
      inquiries: 0,
      leads: 0,
      clients: 0,
      users: 0,
    };

    // 1. Count/Preview test inquiries
    console.log("📝 Checking test inquiries...");
    const inquiries = await db
      .select()
      .from(inquiryTable)
      .where(
        or(
          like(inquiryTable.email, "inquiry%@loadtest.com"),
          like(inquiryTable.inquiryNumber, "INQ-LOADTEST-%")
        )
      );
    counts.inquiries = inquiries.length;
    console.log(`   Found: ${counts.inquiries} test inquiries`);

    // 2. Count/Preview test leads
    console.log("👤 Checking test leads...");
    const leads = await db
      .select()
      .from(leadTable)
      .where(like(leadTable.email, "lead%@loadtest.com"));
    counts.leads = leads.length;
    console.log(`   Found: ${counts.leads} test leads`);

    // 3. Count/Preview test clients
    console.log("🏢 Checking test clients...");
    const clients = await db
      .select()
      .from(clientTable)
      .where(like(clientTable.email, "client%@loadtest.com"));
    counts.clients = clients.length;
    console.log(`   Found: ${counts.clients} test clients`);

    // 4. Count/Preview test users
    console.log("👥 Checking test users...");
    const users = await db
      .select()
      .from(userTable)
      .where(like(userTable.email, "loadtest%@wasteph.com"));
    counts.users = users.length;
    console.log(`   Found: ${counts.users} test users`);

    console.log("");
    console.log("📊 Summary:");
    console.log(`   Inquiries: ${counts.inquiries}`);
    console.log(`   Leads: ${counts.leads}`);
    console.log(`   Clients: ${counts.clients}`);
    console.log(`   Users: ${counts.users}`);
    console.log(
      `   Total records: ${
        counts.inquiries + counts.leads + counts.clients + counts.users
      }`
    );
    console.log("");

    const totalRecords =
      counts.inquiries + counts.leads + counts.clients + counts.users;

    if (totalRecords === 0) {
      console.log("✓ No test data found. Database is clean.");
      console.log("");
      process.exit(0);
    }

    // Determine which test scenario based on counts
    let scenario = "Unknown";
    if (counts.inquiries <= 15 && counts.leads <= 25 && counts.clients <= 15) {
      scenario = "Standard Test (~40 records)";
    } else if (
      counts.inquiries >= 90 &&
      counts.inquiries <= 110 &&
      counts.leads >= 90 &&
      counts.leads <= 110
    ) {
      scenario = "Medium Load Test (300 records)";
    } else if (counts.inquiries >= 400) {
      scenario = "Stress Test (1,500 records)";
    }

    console.log(`🔍 Detected Scenario: ${scenario}`);
    console.log("");

    if (dryRun) {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("  DRY RUN COMPLETE - NO DATA WAS DELETED");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("");
      console.log("To actually delete this data, run:");
      console.log("  npm run cleanup:loadtest");
      console.log("");
      process.exit(0);
    }

    console.log("⚠️  WARNING: This action is IRREVERSIBLE!");
    console.log("⚠️  About to DELETE all test data shown above.");
    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");

    // Actual deletion
    let deletedCount = {
      inquiries: 0,
      leads: 0,
      clients: 0,
      users: 0,
    };

    console.log("🧹 Starting deletion...");
    console.log("");

    // Delete test inquiries
    console.log("📝 Deleting test inquiries...");
    const deletedInquiries = await db
      .delete(inquiryTable)
      .where(
        or(
          like(inquiryTable.email, "inquiry%@loadtest.com"),
          like(inquiryTable.inquiryNumber, "INQ-LOADTEST-%")
        )
      )
      .returning();
    deletedCount.inquiries = deletedInquiries.length;
    console.log(`   ✓ Deleted ${deletedCount.inquiries} test inquiries`);

    // Delete test leads
    console.log("👤 Deleting test leads...");
    const deletedLeads = await db
      .delete(leadTable)
      .where(like(leadTable.email, "lead%@loadtest.com"))
      .returning();
    deletedCount.leads = deletedLeads.length;
    console.log(`   ✓ Deleted ${deletedCount.leads} test leads`);

    // Delete test clients
    console.log("🏢 Deleting test clients...");
    const deletedClients = await db
      .delete(clientTable)
      .where(like(clientTable.email, "client%@loadtest.com"))
      .returning();
    deletedCount.clients = deletedClients.length;
    console.log(`   ✓ Deleted ${deletedCount.clients} test clients`);

    // Delete test users (last, to avoid foreign key issues)
    console.log("👥 Deleting test users...");
    const deletedUsers = await db
      .delete(userTable)
      .where(like(userTable.email, "loadtest%@wasteph.com"))
      .returning();
    deletedCount.users = deletedUsers.length;
    console.log(`   ✓ Deleted ${deletedCount.users} test users`);

    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  CLEANUP COMPLETED SUCCESSFULLY");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");
    console.log("📊 Deletion Summary:");
    console.log(`   Inquiries deleted: ${deletedCount.inquiries}`);
    console.log(`   Leads deleted: ${deletedCount.leads}`);
    console.log(`   Clients deleted: ${deletedCount.clients}`);
    console.log(`   Users deleted: ${deletedCount.users}`);
    console.log(
      `   Total records deleted: ${
        deletedCount.inquiries +
        deletedCount.leads +
        deletedCount.clients +
        deletedCount.users
      }`
    );
    console.log("");
    console.log("✓ All load test data has been safely removed.");
    console.log("✓ Production data was NOT affected.");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("═══════════════════════════════════════════════════════════");
    console.error("  ERROR DURING CLEANUP");
    console.error("═══════════════════════════════════════════════════════════");
    console.error("");
    console.error("❌ Error details:", error);
    console.error("");
    console.error("⚠️  Cleanup may have been partially completed.");
    console.error("⚠️  Please verify your database state.");
    console.error("⚠️  Production data should NOT be affected.");
    console.error("");
    process.exit(1);
  }
};

// Check if running in dry-run mode
const isDryRun = process.argv.includes("--dry-run") || process.argv.includes("--preview");

if (isDryRun) {
  console.log("");
  console.log("Running in DRY RUN mode...");
  console.log("No data will be deleted. This is a preview only.");
}

cleanupLoadTestData(isDryRun);
