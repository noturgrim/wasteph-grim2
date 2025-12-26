import { db } from "../db/index.js";
import { userTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const updateSalesRole = async () => {
  try {
    console.log("🔄 Updating sales user role...\n");

    // Update the sales user's role from 'staff' to 'sales'
    const result = await db
      .update(userTable)
      .set({ role: "sales" })
      .where(eq(userTable.email, "sales@wasteph.com"))
      .returning();

    if (result.length > 0) {
      console.log("✅ Sales user role updated successfully!");
      console.log(`   Email: ${result[0].email}`);
      console.log(`   New Role: ${result[0].role}`);
    } else {
      console.log("⚠️  Sales user not found with email sales@wasteph.com");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating sales user:", error);
    process.exit(1);
  }
};

updateSalesRole();
