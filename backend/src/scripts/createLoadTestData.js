import { db } from "../db/index.js";
import {
  leadTable,
  clientTable,
  inquiryTable,
  userTable,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const createLoadTestData = async () => {
  try {
    console.log("🌱 Creating load test data...");

    // Get load test users for assignment
    const loadTestUsers = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, "loadtest1@wasteph.com"))
      .limit(1);

    if (loadTestUsers.length === 0) {
      console.error(
        "❌ Load test users not found. Run 'npm run seed:loadtest-users' first."
      );
      process.exit(1);
    }

    const testUserId = loadTestUsers[0].id;

    // 1. Create Inquiries
    console.log("\n📝 Creating inquiries...");
    const inquiries = [];
    for (let i = 1; i <= 10; i++) {
      const inquiry = await db
        .insert(inquiryTable)
        .values({
          inquiryNumber: `INQ-LOADTEST-${String(i).padStart(4, "0")}`,
          name: `Test Inquiry ${i}`,
          email: `inquiry${i}@loadtest.com`,
          phone: `09${String(1000000000 + i)}`,
          company: `Test Company ${i}`,
          location: i % 2 === 0 ? "Manila" : "Quezon City",
          message: `This is a test inquiry for load testing purposes - ${i}`,
          status: "initial_comms",
          source: "loadtest",
          assignedTo: testUserId,
          isInformationComplete: true,
        })
        .returning();
      inquiries.push(inquiry[0]);
    }
    console.log(`✅ Created ${inquiries.length} inquiries`);

    // 2. Create Leads
    console.log("\n👤 Creating leads...");
    const leads = [];
    for (let i = 1; i <= 20; i++) {
      const isClaimed = i <= 10; // First 10 are claimed
      const lead = await db
        .insert(leadTable)
        .values({
          clientName: `Lead Client ${i}`,
          company: `Lead Company ${i}`,
          email: `lead${i}@loadtest.com`,
          phone: `09${String(2000000000 + i)}`,
          location: ["Manila", "Quezon City", "Makati", "Pasig", "Taguig"][
            i % 5
          ],
          notes: `Load test lead #${i}`,
          isClaimed,
          claimedBy: isClaimed ? testUserId : null,
          claimedAt: isClaimed ? new Date() : null,
        })
        .returning();
      leads.push(lead[0]);
    }
    console.log(`✅ Created ${leads.length} leads (10 claimed, 10 unclaimed)`);

    // 3. Create Clients
    console.log("\n🏢 Creating clients...");
    const clients = [];
    for (let i = 1; i <= 10; i++) {
      const contractStart = new Date();
      contractStart.setMonth(contractStart.getMonth() - i);
      const contractEnd = new Date(contractStart);
      contractEnd.setFullYear(contractEnd.getFullYear() + 1);

      const client = await db
        .insert(clientTable)
        .values({
          companyName: `Client Company ${i}`,
          contactPerson: `Contact Person ${i}`,
          email: `client${i}@loadtest.com`,
          phone: `09${String(3000000000 + i)}`,
          address: `${i} Test Street, Test Subdivision`,
          city: ["Manila", "Quezon City", "Makati", "Pasig", "Taguig"][i % 5],
          province: "Metro Manila",
          industry: ["Manufacturing", "Retail", "Healthcare", "Education", "Hospitality"][i % 5],
          wasteTypes: "General Waste, Recyclables",
          contractStartDate: contractStart,
          contractEndDate: contractEnd,
          status: "active",
          accountManager: testUserId,
          notes: `Load test client #${i}`,
        })
        .returning();
      clients.push(client[0]);
    }
    console.log(`✅ Created ${clients.length} clients`);

    console.log("\n📊 Summary:");
    console.log(`   Inquiries: ${inquiries.length}`);
    console.log(`   Leads: ${leads.length}`);
    console.log(`   Clients: ${clients.length}`);
    console.log(`   Total records: ${inquiries.length + leads.length + clients.length}`);

    console.log(
      "\n⚠️  IMPORTANT: This is TEST data for load testing only!"
    );
    console.log("   Delete it from production after testing.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating load test data:", error);
    process.exit(1);
  }
};

createLoadTestData();
