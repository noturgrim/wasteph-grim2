import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "..", "..", ".env");
dotenv.config({ path: envPath });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

console.log("📡 Connecting to database...");
const sql = postgres(connectionString);

async function runMigration() {
  try {
    console.log("🔄 Running migration: add_activity_log_inquiry_id...");

    const migrationPath = path.join(
      __dirname,
      "..",
      "migrations",
      "add_activity_log_inquiry_id.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    await sql.unsafe(migrationSQL);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
