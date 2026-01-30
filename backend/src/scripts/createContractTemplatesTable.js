import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

/**
 * Migration: Create contract_templates table
 * This script creates the contract_templates table for managing contract templates
 */

async function createContractTemplatesTable() {
  console.log("🔄 Creating contract_templates table...\n");

  try {
    // Create contract_templates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contract_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        html_template TEXT NOT NULL,
        template_type contract_type_enum,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    console.log("✅ Created contract_templates table");

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS contract_templates_name_idx ON contract_templates(name);
    `);
    console.log("✅ Created index: contract_templates_name_idx");

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS contract_templates_type_idx ON contract_templates(template_type);
    `);
    console.log("✅ Created index: contract_templates_type_idx");

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS contract_templates_is_active_idx ON contract_templates(is_active);
    `);
    console.log("✅ Created index: contract_templates_is_active_idx");

    console.log("\n✅ Contract templates table created successfully!");

  } catch (error) {
    console.error("\n❌ Error creating contract_templates table:", error);
    throw error;
  }
}

// Run migration
async function main() {
  console.log("========================================");
  console.log("  CREATE CONTRACT TEMPLATES TABLE");
  console.log("========================================\n");

  try {
    await createContractTemplatesTable();

    console.log("\n========================================");
    console.log("      MIGRATION COMPLETE! ✅");
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
