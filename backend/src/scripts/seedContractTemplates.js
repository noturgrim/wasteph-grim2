import { db } from "../db/index.js";
import { contractTemplatesTable } from "../db/schema.js";
import { sql } from "drizzle-orm";

/**
 * Seed default contract templates
 * Creates basic templates for each contract type
 */

// Base contract template HTML
const getBaseTemplate = (contractType) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Contract</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px 60px;
      background: #fff;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #2c5282;
      padding-bottom: 20px;
    }

    .header h1 {
      font-size: 28px;
      color: #2c5282;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .header .contract-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      font-size: 14px;
      color: #666;
    }

    .section {
      margin-bottom: 30px;
    }

    .section h3 {
      font-size: 16px;
      color: #2c5282;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 14px;
      color: #1a202c;
      font-weight: 500;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .terms-list {
      margin-left: 20px;
      margin-top: 10px;
    }

    .terms-list li {
      margin-bottom: 8px;
      color: #4a5568;
      font-size: 14px;
    }

    .signatories {
      margin-top: 60px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }

    .signature-block {
      text-align: center;
    }

    .signature-line {
      border-top: 2px solid #2d3748;
      margin-bottom: 8px;
      padding-top: 50px;
    }

    .signature-name {
      font-size: 14px;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 4px;
    }

    .signature-position {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #a0aec0;
    }

    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Service Contract</h1>
    <div class="contract-meta">
      <div>
        <strong>Contract No:</strong> {{contractNumber}}
      </div>
      <div>
        <strong>Date:</strong> {{contractDate}}
      </div>
    </div>
  </div>

  <!-- Client Information -->
  <div class="section">
    <h3>Client Information</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Company Name</span>
        <span class="info-value">{{companyName}}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Contact Person</span>
        <span class="info-value">{{clientName}}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Email Address</span>
        <span class="info-value">{{clientEmail}}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Contract Duration</span>
        <span class="info-value">{{contractDuration}}</span>
      </div>
      <div class="info-item full-width">
        <span class="info-label">Service Address</span>
        <span class="info-value">{{clientAddress}}</span>
      </div>
    </div>
  </div>

  <!-- Service Details -->
  <div class="section">
    <h3>Service Details</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Contract Type</span>
        <span class="info-value">${contractType}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Collection Schedule</span>
        <span class="info-value">{{collectionSchedule}}{{#if collectionScheduleOther}} - {{collectionScheduleOther}}{{/if}}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Waste Allowance</span>
        <span class="info-value">{{wasteAllowance}}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Rate Specification</span>
        <span class="info-value">{{ratePerKg}}</span>
      </div>
      <div class="info-item full-width">
        <span class="info-label">Service Location Coordinates</span>
        <span class="info-value">Lat: {{serviceLatitude}}, Long: {{serviceLongitude}}</span>
      </div>
    </div>
  </div>

  <!-- Special Clauses -->
  <div class="section">
    <h3>Special Clauses & Terms</h3>
    <div class="info-item">
      <span class="info-value">{{specialClauses}}</span>
    </div>
  </div>

  {{#if clientRequests}}
  <!-- Client Requests -->
  <div class="section">
    <h3>Client Requests & Modifications</h3>
    <div class="info-item">
      <span class="info-value">{{clientRequests}}</span>
    </div>
  </div>
  {{/if}}

  <!-- Signatories -->
  <div class="section">
    <h3>Agreement Signatures</h3>
    <div class="signatories">
      {{#each signatories}}
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name">{{this.name}}</div>
        <div class="signature-position">{{this.position}}</div>
      </div>
      {{/each}}
    </div>
  </div>

  <div class="footer">
    This is a computer-generated contract. Please verify all details before signing.
  </div>
</body>
</html>
`;

const templates = [
  {
    name: "Long Term Variable Rate Contract",
    description: "Standard contract template for long-term garbage collection with variable rates based on actual waste volume",
    templateType: "long_term_variable",
    htmlTemplate: getBaseTemplate("Long Term Garbage Variable Charge"),
    isDefault: true,
  },
  {
    name: "Long Term Fixed Rate Contract",
    description: "Contract template for long-term garbage collection with fixed monthly rate (for contracts over 50,000 PHP/month)",
    templateType: "long_term_fixed",
    htmlTemplate: getBaseTemplate("Long Term Garbage Fixed Charge"),
    isDefault: false,
  },
  {
    name: "Fixed Rate Term Contract",
    description: "Contract template for fixed-rate services over a specified term",
    templateType: "fixed_rate_term",
    htmlTemplate: getBaseTemplate("Fixed Rate Term"),
    isDefault: false,
  },
  {
    name: "Garbage Bins Contract",
    description: "Contract template for garbage bin rental services",
    templateType: "garbage_bins",
    htmlTemplate: getBaseTemplate("Garbage Bins Rental"),
    isDefault: false,
  },
  {
    name: "Garbage Bins with Disposal Contract",
    description: "Contract template for garbage bin rental with waste disposal services",
    templateType: "garbage_bins_disposal",
    htmlTemplate: getBaseTemplate("Garbage Bins with Disposal"),
    isDefault: false,
  },
];

async function seedContractTemplates() {
  console.log("🔄 Seeding contract templates...\n");

  try {
    for (const template of templates) {
      // Check if template already exists
      const existing = await db
        .select()
        .from(contractTemplatesTable)
        .where(sql`${contractTemplatesTable.name} = ${template.name}`)
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Skipping "${template.name}" - already exists`);
        continue;
      }

      // Insert template
      await db.insert(contractTemplatesTable).values(template);
      console.log(`✅ Created template: "${template.name}"`);
    }

    console.log("\n✅ Contract templates seeded successfully!");

  } catch (error) {
    console.error("\n❌ Error seeding templates:", error);
    throw error;
  }
}

// Run seed
async function main() {
  console.log("========================================");
  console.log("   SEED CONTRACT TEMPLATES");
  console.log("========================================\n");

  try {
    await seedContractTemplates();

    console.log("\n========================================");
    console.log("       SEEDING COMPLETE! ✅");
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
