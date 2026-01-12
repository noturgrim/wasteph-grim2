import { db } from "../db/index.js";
import { proposalTemplateTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedCompactorHaulingTemplate() {
  try {
    console.log("📝 Seeding Compactor Hauling Template...");

    // Read HTML template
    const htmlPath = path.join(
      __dirname,
      "..",
      "templates",
      "compactor-hauling.html"
    );
    const htmlTemplate = await fs.readFile(htmlPath, "utf-8");

    console.log("✅ HTML template loaded from:", htmlPath);

    // Check if already exists
    const existing = await db
      .select()
      .from(proposalTemplateTable)
      .where(eq(proposalTemplateTable.templateType, "compactor_hauling"))
      .limit(1);

    if (existing.length > 0) {
      console.log("ℹ️  Compactor Hauling template already exists");
      console.log("   Template ID:", existing[0].id);
      console.log("   Template Name:", existing[0].name);
      return;
    }

    // Template configuration
    const templateConfig = {
      hasWasteAllowance: true,
      hasExcessRate: true,
      billingCycle: "monthly",
      requiresSchedule: true,
      pricePerMonth: true,
    };

    // Insert template
    const [template] = await db
      .insert(proposalTemplateTable)
      .values({
        name: "One Time Compactor Hauling",
        description:
          "Monthly waste collection service with waste allowance and excess billing",
        htmlTemplate,
        templateType: "compactor_hauling",
        category: "waste_collection",
        templateConfig: JSON.stringify(templateConfig),
        isActive: true,
        isDefault: true, // First template becomes default
      })
      .returning();

    console.log("✅ Compactor Hauling template seeded successfully");
    console.log("   Template ID:", template.id);
    console.log("   Template Type:", template.templateType);
    console.log("   Category:", template.category);
    console.log("   Is Default:", template.isDefault);
    console.log("   Config:", templateConfig);
  } catch (error) {
    console.error("❌ Error seeding template:", error);
    throw error;
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the seed function
seedCompactorHaulingTemplate();
