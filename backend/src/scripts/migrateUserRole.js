import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const migrateUserRole = async () => {
  let client;

  try {
    console.log("🔄 Migrating user_role enum...\n");

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined in environment variables");
    }

    client = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
    });

    console.log("📡 Connected to database\n");

    // Step 1: Add 'sales' to the enum if it doesn't exist
    console.log("1. Adding 'sales' to user_role enum...");
    await client`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'sales'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
          ALTER TYPE user_role ADD VALUE 'sales';
        END IF;
      END $$;
    `;
    console.log("   ✅ 'sales' value added to enum\n");

    // Step 2: Update any users with 'staff' role to 'sales'
    console.log("2. Updating users with 'staff' role to 'sales'...");
    const result = await client`
      UPDATE "user"
      SET role = 'sales'
      WHERE role = 'staff'
      RETURNING email, role
    `;

    if (result.length > 0) {
      console.log(`   ✅ Updated ${result.length} user(s):`);
      result.forEach(user => {
        console.log(`      - ${user.email} → ${user.role}`);
      });
    } else {
      console.log("   ℹ️  No users with 'staff' role found");
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n⚠️  Note: The old 'staff' and 'manager' enum values still exist in the database.");
    console.log("   They are harmless but if you want to remove them, you'll need to:");
    console.log("   1. Drop the user_role enum");
    console.log("   2. Recreate it with only [admin, sales]");
    console.log("   3. This requires recreating the user table\n");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error migrating user role:", error.message);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
};

migrateUserRole();
