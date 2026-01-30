import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

/**
 * Migration: Add template fields to contracts table
 * This script adds template-related fields to the contracts table
 */

async function addContractTemplateFields() {
  console.log("🔄 Adding template fields to contracts table...\n");

  try {
    // Add template_id column
    await db.execute(sql`
      ALTER TABLE contracts
      ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES contract_templates(id);
    `);
    console.log("✅ Added column: template_id");

    // Add contract_data column (JSON)
    await db.execute(sql`
      ALTER TABLE contracts
      ADD COLUMN IF NOT EXISTS contract_data TEXT;
    `);
    console.log("✅ Added column: contract_data");

    // Add edited_html_content column
    await db.execute(sql`
      ALTER TABLE contracts
      ADD COLUMN IF NOT EXISTS edited_html_content TEXT;
    `);
    console.log("✅ Added column: edited_html_content");

    console.log("\n✅ All template fields added successfully!");

  } catch (error) {
    console.error("\n❌ Error adding template fields:", error);
    throw error;
  }
}

// Run migration
async function main() {
  console.log("========================================");
  console.log("   ADD CONTRACT TEMPLATE FIELDS");
  console.log("========================================\n");

  try {
    await addContractTemplateFields();

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
