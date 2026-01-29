import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = postgres(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log("🔄 Starting custom template URL migration...");

    // Read migration SQL
    const migrationSQL = readFileSync(
      join(__dirname, "../migrations/add_custom_template_url.sql"),
      "utf-8"
    );

    console.log("📝 Executing migration...");
    await sql.unsafe(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("   - Added custom_template_url column to contracts table");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigration();
