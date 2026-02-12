import { db } from "../db/index.js";
import { userTable } from "../db/schema.js";
import { hashPassword } from "../auth/password.js";
import { generateIdFromEntropySize } from "lucia";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const seedLoadTestUsers = async () => {
  try {
    console.log("🌱 Seeding load test users for infrastructure testing...");

    const users = [
      {
        email: "loadtest1@wasteph.com",
        password: "LoadTest@123",
        firstName: "LoadTest",
        lastName: "Sales1",
        role: "sales",
        isMasterSales: false,
      },
      {
        email: "loadtest2@wasteph.com",
        password: "LoadTest@123",
        firstName: "LoadTest",
        lastName: "MasterSales",
        role: "sales",
        isMasterSales: true,
      },
      {
        email: "loadtest3@wasteph.com",
        password: "LoadTest@123",
        firstName: "LoadTest",
        lastName: "Admin",
        role: "admin",
        isMasterSales: false,
      },
      {
        email: "loadtest4@wasteph.com",
        password: "LoadTest@123",
        firstName: "LoadTest",
        lastName: "SuperAdmin",
        role: "super_admin",
        isMasterSales: false,
      },
      {
        email: "loadtest5@wasteph.com",
        password: "LoadTest@123",
        firstName: "LoadTest",
        lastName: "SocialMedia",
        role: "social_media",
        isMasterSales: false,
      },
      {
        email: "loadtest6@wasteph.com",
        password: "LoadTest@123",
        firstName: "LoadTest",
        lastName: "Sales2",
        role: "sales",
        isMasterSales: false,
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Generate user ID
      const userId = generateIdFromEntropySize(10);

      // Create user
      await db
        .insert(userTable)
        .values({
          id: userId,
          email: userData.email,
          hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          isMasterSales: userData.isMasterSales || false,
          isActive: true,
        })
        .returning();

      console.log(`✅ ${userData.role} user created successfully!`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      createdCount++;
    }

    console.log("\n📊 Summary:");
    console.log(`   Created: ${createdCount} users`);
    console.log(`   Skipped: ${skippedCount} users (already exist)`);
    console.log(`   Total: ${users.length} users`);

    console.log(
      "\n⚠️  IMPORTANT: These are TEST accounts for load testing only!"
    );
    console.log("   Delete them from production after testing.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding load test users:", error);
    process.exit(1);
  }
};

seedLoadTestUsers();
