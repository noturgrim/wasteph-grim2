import { db } from "../db/index.js";
import { proposalTemplateTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templates = [
  {
    name: "One Time Compactor Hauling",
    description: "Monthly waste collection service with waste allowance and excess billing",
    fileName: "compactor-hauling.html",
    templateType: "compactor_hauling",
    category: "waste_collection",
    templateConfig: {
      hasWasteAllowance: true,
      hasExcessRate: true,
      billingCycle: "monthly",
      requiresSchedule: true,
    },
    isDefault: true, // First template is default
  },
  {
    name: "Hazardous Waste Collection",
    description: "Specialized collection and disposal of hazardous materials with proper documentation",
    fileName: "hazardous-waste.html",
    templateType: "hazardous_waste",
    category: "hazardous",
    templateConfig: {
      requiresManifest: true,
      requiresLicense: true,
    },
    isDefault: false,
  },
  {
    name: "Fixed Monthly Rate",
    description: "Fixed monthly fee for unlimited waste collection services",
    fileName: "fixed-monthly.html",
    templateType: "fixed_monthly",
    category: "waste_collection",
    templateConfig: {
      hasContractDuration: true,
      hasMonthlyRate: true,
      hasPickupSchedule: true,
    },
    isDefault: false,
  },
  {
    name: "Clearing Project",
    description: "Project-based site clearing with equipment and labor",
    fileName: "clearing-project.html",
    templateType: "clearing_project",
    category: "waste_collection",
    templateConfig: {
      hasEquipment: true,
      hasLaborCrew: true,
      hasProjectDuration: true,
    },
    isDefault: false,
  },
  {
    name: "One Time Hauling",
    description: "Per-trip hauling service for one-time waste removal",
    fileName: "one-time-hauling.html",
    templateType: "one_time_hauling",
    category: "waste_collection",
    templateConfig: {
      hasTruckType: true,
      hasNumberOfTrips: true,
      hasRatePerTrip: true,
    },
    isDefault: false,
  },
  {
    name: "Long Term Garbage (Per-kg)",
    description: "Long-term contract with per-kilogram pricing model",
    fileName: "long-term.html",
    templateType: "long_term",
    category: "waste_collection",
    templateConfig: {
      hasRatePerKg: true,
      hasMinimumCharge: true,
      hasContractDuration: true,
      hasWeighingMethod: true,
    },
    isDefault: false,
  },
  {
    name: "Purchase of Recyclables",
    description: "We purchase recyclable materials from your facility",
    fileName: "recyclables-purchase.html",
    templateType: "recyclables_purchase",
    category: "recyclables",
    templateConfig: {
      hasRecyclableTypes: true,
      hasPurchaseRates: true,
      hasQualityRequirements: true,
    },
    isDefault: false,
  },
];

async function seedAllTemplates() {
  try {
    console.log("🌱 Starting template seeding process...\n");

    for (const templateData of templates) {
      // Read HTML template file
      const htmlPath = path.join(__dirname, "..", "templates", templateData.fileName);

      let htmlTemplate;
      try {
        htmlTemplate = await fs.readFile(htmlPath, "utf-8");
      } catch (error) {
        console.error(`❌ Failed to read ${templateData.fileName}:`, error.message);
        continue;
      }

      // Check if template already exists
      const existing = await db
        .select()
        .from(proposalTemplateTable)
        .where(eq(proposalTemplateTable.templateType, templateData.templateType))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  ${templateData.name} already exists, skipping...`);
        continue;
      }

      // Insert template
      await db.insert(proposalTemplateTable).values({
        name: templateData.name,
        description: templateData.description,
        htmlTemplate,
        templateType: templateData.templateType,
        category: templateData.category,
        templateConfig: JSON.stringify(templateData.templateConfig),
        isActive: true,
        isDefault: templateData.isDefault,
      });

      console.log(`✅ ${templateData.name} seeded successfully`);
    }

    console.log("\n🎉 Template seeding completed!\n");

    // Show summary
    const allTemplates = await db.select().from(proposalTemplateTable);
    console.log(`📊 Total templates in database: ${allTemplates.length}\n`);

    console.log("Templates by category:");
    const byCategory = allTemplates.reduce((acc, t) => {
      const cat = t.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t.name);
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, names]) => {
      console.log(`\n  ${category}:`);
      names.forEach(name => console.log(`    - ${name}`));
    });

    console.log("\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  }
}

seedAllTemplates();
