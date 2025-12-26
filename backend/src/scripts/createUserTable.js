import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const createUserTable = async () => {
  let client;

  try {
    console.log("🔧 Creating user table...\n");

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

    // Create user table
    await client`
      CREATE TABLE "user" (
        id text PRIMARY KEY,
        email text NOT NULL UNIQUE,
        hashed_password text NOT NULL,
        first_name text NOT NULL,
        last_name text NOT NULL,
        role user_role DEFAULT 'sales' NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    console.log("✅ User table created successfully!\n");
    console.log("📋 Next step: Run 'npm run seed:admin' to create users\n");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating user table:", error.message);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
};

createUserTable();
