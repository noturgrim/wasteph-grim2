import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const checkDatabase = async () => {
  let client;

  try {
    console.log("🔍 Checking database contents...\n");

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

    console.log("📊 Tables and Row Counts:\n");

    // Check each table
    const tables = [
      "user",
      "session",
      "inquiry",
      "lead",
      "potential",
      "client",
      "activity_log",
    ];

    for (const table of tables) {
      try {
        const result = await client`
          SELECT COUNT(*) as count
          FROM ${client(table)}
        `;
        console.log(`  ${table.padEnd(15)} : ${result[0].count} rows`);
      } catch (error) {
        console.log(`  ${table.padEnd(15)} : Table does not exist`);
      }
    }

    console.log("\n👥 Users in database:\n");
    try {
      const users = await client`
        SELECT id, email, first_name, last_name, role, is_active, created_at
        FROM "user"
        ORDER BY created_at DESC
      `;

      if (users.length === 0) {
        console.log("  No users found");
      } else {
        users.forEach((user) => {
          console.log(`  📧 ${user.email}`);
          console.log(`     Name: ${user.first_name} ${user.last_name}`);
          console.log(`     Role: ${user.role}`);
          console.log(`     Active: ${user.is_active}`);
          console.log(`     Created: ${user.created_at}\n`);
        });
      }
    } catch (error) {
      console.log("  User table does not exist or error reading it");
    }

    console.log("📋 Available Enums:\n");
    try {
      const enums = await client`
        SELECT t.typname as enum_name,
               array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname IN ('user_role', 'inquiry_status', 'lead_status', 'client_status')
        GROUP BY t.typname
        ORDER BY t.typname
      `;

      if (enums.length === 0) {
        console.log("  No enums found");
      } else {
        enums.forEach((enumType) => {
          console.log(`  ${enumType.enum_name}: [${enumType.values.join(", ")}]`);
        });
      }
    } catch (error) {
      console.log("  Error reading enums");
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking database:", error.message);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
};

checkDatabase();
