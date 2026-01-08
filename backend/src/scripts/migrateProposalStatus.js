import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const migrateProposalStatus = async () => {
  let client;

  try {
    console.log("🔄 Migrating proposal_status enum and table...\n");

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

    // Step 1: Add 'sent' to the enum if it doesn't exist
    console.log("1. Adding 'sent' to proposal_status enum...");
    await client`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'sent'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'proposal_status')
        ) THEN
          ALTER TYPE proposal_status ADD VALUE 'sent';
        END IF;
      END $$;
    `;
    console.log("   ✅ 'sent' value added to enum\n");

    // Step 2: Add sentBy column if it doesn't exist
    console.log("2. Adding sent_by column...");
    await client`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'proposal'
          AND column_name = 'sent_by'
        ) THEN
          ALTER TABLE "proposal"
          ADD COLUMN sent_by TEXT REFERENCES "user"(id);
        END IF;
      END $$;
    `;
    console.log("   ✅ sent_by column added\n");

    // Step 3: Add sentAt column if it doesn't exist
    console.log("3. Adding sent_at column...");
    await client`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'proposal'
          AND column_name = 'sent_at'
        ) THEN
          ALTER TABLE "proposal"
          ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
        END IF;
      END $$;
    `;
    console.log("   ✅ sent_at column added\n");

    // Step 4: Update any 'approved' proposals that have been emailed to 'sent' status
    console.log("4. Updating historical 'approved' proposals with emails...");
    const result = await client`
      UPDATE "proposal"
      SET status = 'sent', sent_at = email_sent_at
      WHERE status = 'approved'
      AND email_status = 'sent'
      AND email_sent_at IS NOT NULL
      RETURNING id, status
    `;

    if (result.length > 0) {
      console.log(`   ✅ Updated ${result.length} proposal(s) to 'sent' status`);
    } else {
      console.log("   ℹ️  No historical proposals to update");
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\nNew workflow is now active:");
    console.log("  - Sales creates proposal → pending");
    console.log("  - Admin approves → approved (no email)");
    console.log("  - Sales sends → sent (email sent to client)\n");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error migrating proposal status:", error.message);
    console.error(error);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
};

migrateProposalStatus();

