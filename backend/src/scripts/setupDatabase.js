import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const setupDatabase = async () => {
  let client;

  try {
    console.log("🔧 Setting up database with new schema...\n");

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

    // Create enums
    console.log("Creating enums...");
    await client`
      CREATE TYPE user_role AS ENUM ('admin', 'sales');
    `;
    console.log("  ✅ Created user_role enum");

    await client`
      CREATE TYPE inquiry_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'closed');
    `;
    console.log("  ✅ Created inquiry_status enum");

    await client`
      CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost');
    `;
    console.log("  ✅ Created lead_status enum");

    await client`
      CREATE TYPE client_status AS ENUM ('active', 'inactive', 'suspended');
    `;
    console.log("  ✅ Created client_status enum\n");

    // Create user table
    console.log("Creating user table...");
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
    console.log("  ✅ Created user table\n");

    // Create session table
    console.log("Creating session table...");
    await client`
      CREATE TABLE session (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        expires_at timestamp with time zone NOT NULL
      );
    `;
    console.log("  ✅ Created session table\n");

    // Create inquiry table
    console.log("Creating inquiry table...");
    await client`
      CREATE TABLE inquiry (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        email text NOT NULL,
        phone text,
        company text,
        message text NOT NULL,
        status inquiry_status DEFAULT 'new' NOT NULL,
        source text DEFAULT 'website',
        assigned_to text REFERENCES "user"(id),
        notes text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    console.log("  ✅ Created inquiry table\n");

    // Create lead table
    console.log("Creating lead table...");
    await client`
      CREATE TABLE lead (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name text NOT NULL,
        contact_person text NOT NULL,
        email text NOT NULL,
        phone text NOT NULL,
        address text,
        city text,
        province text,
        waste_type text,
        estimated_volume text,
        status lead_status DEFAULT 'new' NOT NULL,
        priority integer DEFAULT 3,
        estimated_value integer,
        assigned_to text REFERENCES "user"(id),
        notes text,
        next_follow_up timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    console.log("  ✅ Created lead table\n");

    // Create potential table
    console.log("Creating potential table...");
    await client`
      CREATE TABLE potential (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name text NOT NULL,
        contact_person text NOT NULL,
        email text,
        phone text,
        address text,
        city text,
        province text,
        industry text,
        waste_type text,
        estimated_volume text,
        source text,
        priority integer DEFAULT 3,
        assigned_to text REFERENCES "user"(id),
        notes text,
        last_contact timestamp with time zone,
        next_follow_up timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    console.log("  ✅ Created potential table\n");

    // Create client table
    console.log("Creating client table...");
    await client`
      CREATE TABLE client (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name text NOT NULL,
        contact_person text NOT NULL,
        email text NOT NULL UNIQUE,
        phone text NOT NULL,
        address text NOT NULL,
        city text NOT NULL,
        province text NOT NULL,
        industry text,
        waste_types text,
        contract_start_date timestamp with time zone,
        contract_end_date timestamp with time zone,
        status client_status DEFAULT 'active' NOT NULL,
        account_manager text REFERENCES "user"(id),
        notes text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    console.log("  ✅ Created client table\n");

    // Create activity_log table
    console.log("Creating activity_log table...");
    await client`
      CREATE TABLE activity_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id text NOT NULL,
        details text,
        ip_address text,
        user_agent text,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    console.log("  ✅ Created activity_log table\n");

    console.log("✅ Database setup completed successfully!\n");
    console.log("📋 Next step: Run 'npm run seed:admin' to create users\n");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up database:", error.message);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
};

setupDatabase();
