import { db } from "../db/index.js";
import { userTable } from "../db/schema.js";
import { hashPassword } from "../auth/password.js";
import { generateIdFromEntropySize } from "lucia";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log("🌱 Seeding admin and sales users...");

    const users = [
      {
        email: "admin@wasteph.com",
        password: "Admin@123456",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      },
      {
        email: "sales@wasteph.com",
        password: "Sales@123456",
        firstName: "Sales",
        lastName: "Rep",
        role: "sales",
      },
    ];

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
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
          isActive: true,
        })
        .returning();

      console.log(`✅ ${userData.role} user created successfully!`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
    }

    console.log("\n⚠️  IMPORTANT: Change passwords after first login!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
};

seedAdmin();
