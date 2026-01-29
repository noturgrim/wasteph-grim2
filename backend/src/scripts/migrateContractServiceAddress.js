import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import postgres from "postgres";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../../.env");
dotenv.config({ path: envPath });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined in environment variables");
  process.exit(1);
}

console.log("🔄 Starting contract service address migration...");

const sql = postgres(DATABASE_URL, { max: 1 });

try {
  // Read migration SQL file
  const migrationPath = join(__dirname, "../migrations/update_contract_service_address.sql");
  const migrationSQL = fs.readFileSync(migrationPath, "utf8");

  console.log("📝 Executing migration...");
  await sql.unsafe(migrationSQL);

  console.log("✅ Migration completed successfully!");
  console.log("   - Added service_latitude column");
  console.log("   - Added service_longitude column");
  console.log("   - Removed service_address column");
  console.log("   - Removed actual_address column");
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  await sql.end();
}
