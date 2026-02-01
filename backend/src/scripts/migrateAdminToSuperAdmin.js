import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const migrateAdminToSuperAdmin = async () => {
  let client;

  try {
    console.log("🔄 Migrating admin user to super_admin...\n");

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

    // Step 1: Add new enum values if they don't exist
    console.log("1. Adding 'social_media' to user_role enum...");
    await client`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'social_media'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
          ALTER TYPE user_role ADD VALUE 'social_media';
        END IF;
      END $$;
    `;
    console.log("   ✅ 'social_media' value added to enum\n");

    console.log("   Adding 'super_admin' to user_role enum...");
    await client`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'super_admin'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
          ALTER TYPE user_role ADD VALUE 'super_admin';
        END IF;
      END $$;
    `;
    console.log("   ✅ 'super_admin' value added to enum\n");

    // Step 2: Update existing admin user to super_admin
    console.log("2. Updating admin user to super_admin...");
    const result = await client`
      UPDATE "user"
      SET role = 'super_admin'
      WHERE role = 'admin'
      RETURNING email, role
    `;

    if (result.length > 0) {
      console.log(`   ✅ Updated ${result.length} user(s):`);
      result.forEach((user) => {
        console.log(`      - ${user.email} → ${user.role}`);
      });
    } else {
      console.log("   ℹ️  No users with 'admin' role found");
    }

    console.log("\n✅ Migration completed successfully!");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error migrating to super_admin:", error.message);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
};

migrateAdminToSuperAdmin();
