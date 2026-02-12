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

const cleanupLoadTestData = async () => {
  try {
    console.log("🧹 Starting cleanup of load test data...");
    console.log("⚠️  This will delete all test data created for load testing.");
    console.log("");

    let deletedCount = {
      inquiries: 0,
      leads: 0,
      clients: 0,
      users: 0,
    };

    // 1. Delete test inquiries
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

    // 2. Delete test leads
    console.log("👤 Deleting test leads...");
    const deletedLeads = await db
      .delete(leadTable)
      .where(like(leadTable.email, "lead%@loadtest.com"))
      .returning();
    deletedCount.leads = deletedLeads.length;
    console.log(`   ✓ Deleted ${deletedCount.leads} test leads`);

    // 3. Delete test clients
    console.log("🏢 Deleting test clients...");
    const deletedClients = await db
      .delete(clientTable)
      .where(like(clientTable.email, "client%@loadtest.com"))
      .returning();
    deletedCount.clients = deletedClients.length;
    console.log(`   ✓ Deleted ${deletedCount.clients} test clients`);

    // 4. Delete test users (last, to avoid foreign key issues)
    console.log("👥 Deleting test users...");
    const deletedUsers = await db
      .delete(userTable)
      .where(like(userTable.email, "loadtest%@wasteph.com"))
      .returning();
    deletedCount.users = deletedUsers.length;
    console.log(`   ✓ Deleted ${deletedCount.users} test users`);

    console.log("");
    console.log("📊 Cleanup Summary:");
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
    if (
      deletedCount.inquiries === 0 &&
      deletedCount.leads === 0 &&
      deletedCount.clients === 0 &&
      deletedCount.users === 0
    ) {
      console.log("✓ No test data found. Database is clean.");
    } else {
      console.log("✓ Cleanup completed successfully!");
      console.log("  All load test data has been safely removed.");
    }
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
    console.error("");
    console.error("Cleanup failed. Please check the error above.");
    console.error("Your production data has NOT been affected.");
    process.exit(1);
  }
};

// Safety confirmation
console.log("");
console.log("═══════════════════════════════════════════════════════════");
console.log("  LOAD TEST DATA CLEANUP");
console.log("═══════════════════════════════════════════════════════════");
console.log("");
console.log("This script will DELETE the following test data:");
console.log("  • 6 test user accounts (loadtest1-6@wasteph.com)");
console.log("  • ~10 test inquiries (inquiry*@loadtest.com)");
console.log("  • ~20 test leads (lead*@loadtest.com)");
console.log("  • ~10 test clients (client*@loadtest.com)");
console.log("");
console.log("This action is IRREVERSIBLE.");
console.log("Only test data matching the patterns above will be deleted.");
console.log("Production data will NOT be affected.");
console.log("");
console.log("═══════════════════════════════════════════════════════════");
console.log("");

cleanupLoadTestData();
