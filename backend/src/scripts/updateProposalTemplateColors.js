import { db } from "../db/index.js";
import { proposalTemplateTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

/**
 * Update Proposal Template Colors from Blue to Dark Green
 * Run with: node src/scripts/updateProposalTemplateColors.js
 */

const updatedTemplateHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WastePH - Proposal</title>
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
      background: #ffffff;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }

    .header {
      text-align: center;
      border-bottom: 4px solid #166534;
      padding-bottom: 30px;
      margin-bottom: 40px;
    }

    .header img {
      max-width: 200px;
      height: auto;
      margin-bottom: 20px;
    }

    .header h1 {
      color: #166534;
      font-size: 36px;
      margin-bottom: 10px;
    }

    .header .subtitle {
      color: #666;
      font-size: 16px;
    }

    .meta-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .meta-section h3 {
      color: #166534;
      font-size: 14px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .meta-section p {
      margin: 5px 0;
      font-size: 14px;
    }

    .section {
      margin-bottom: 40px;
    }

    .section-title {
      color: #166534;
      font-size: 24px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 10px;
    }

    .services-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .services-table th {
      background: #166534;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }

    .services-table td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }

    .services-table tr:last-child td {
      border-bottom: none;
    }

    .services-table .service-name {
      font-weight: bold;
      color: #166534;
    }

    .services-table .service-description {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .services-table .text-right {
      text-align: right;
    }

    .pricing-summary {
      margin-left: auto;
      width: 400px;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
    }

    .pricing-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #ddd;
    }

    .pricing-row:last-child {
      border-bottom: none;
      font-weight: bold;
      font-size: 18px;
      color: #166534;
      padding-top: 15px;
      border-top: 2px solid #166534;
    }

    .terms-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }

    .terms-section h4 {
      color: #166534;
      margin-bottom: 10px;
    }

    .terms-section p {
      margin: 8px 0;
      font-size: 14px;
    }

    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 3px solid #166534;
      text-align: center;
      color: #666;
      font-size: 12px;
    }

    .footer p {
      margin: 5px 0;
    }

    .footer strong {
      color: #166534;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if companyLogoUrl}}
      <img src="{{companyLogoUrl}}" alt="WastePH Logo">
      {{/if}}
      <h1>BUSINESS PROPOSAL</h1>
      <p class="subtitle">Professional Waste Management Solutions</p>
    </div>

    <!-- Meta Information -->
    <div class="meta-info">
      <div class="meta-section">
        <h3>Prepared For</h3>
        <p><strong>{{clientName}}</strong></p>
        {{#if clientCompany}}
        <p>{{clientCompany}}</p>
        {{/if}}
        <p>{{clientEmail}}</p>
        {{#if clientPhone}}
        <p>{{clientPhone}}</p>
        {{/if}}
      </div>

      <div class="meta-section">
        <h3>Proposal Details</h3>
        <p><strong>Date:</strong> {{proposalDate}}</p>
        <p><strong>Valid Until:</strong> {{validUntilDate}}</p>
      </div>
    </div>

    <!-- Services Section -->
    <div class="section">
      <h2 class="section-title">Proposed Services</h2>

      <table class="services-table">
        <thead>
          <tr>
            <th style="width: 40%;">Service</th>
            <th style="width: 15%;" class="text-right">Quantity</th>
            <th style="width: 20%;" class="text-right">Unit Price</th>
            <th style="width: 25%;" class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {{#each services}}
          <tr>
            <td>
              <div class="service-name">{{this.name}}</div>
              {{#if this.description}}
              <div class="service-description">{{this.description}}</div>
              {{/if}}
            </td>
            <td class="text-right">{{this.quantity}}</td>
            <td class="text-right">{{currency this.unitPrice}}</td>
            <td class="text-right">{{currency this.subtotal}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>

    <!-- Pricing Summary -->
    <div class="pricing-summary">
      <div class="pricing-row">
        <span>Subtotal:</span>
        <span>{{currency pricing.subtotal}}</span>
      </div>

      {{#if pricing.discount}}
      {{#ifGreaterThan pricing.discount 0}}
      <div class="pricing-row">
        <span>Discount:</span>
        <span>- {{currency pricing.discount}}</span>
      </div>
      {{/ifGreaterThan}}
      {{/if}}

      {{#if pricing.tax}}
      {{#ifGreaterThan pricing.tax 0}}
      <div class="pricing-row">
        <span>Tax ({{pricing.taxRate}}%):</span>
        <span>{{currency pricing.tax}}</span>
      </div>
      {{/ifGreaterThan}}
      {{/if}}

      <div class="pricing-row">
        <span>TOTAL:</span>
        <span>{{currency pricing.total}}</span>
      </div>
    </div>

    <!-- Terms and Conditions -->
    <div class="terms-section">
      <h4>Terms & Conditions</h4>

      <p><strong>Payment Terms:</strong> {{terms.paymentTerms}}</p>
      <p><strong>Validity:</strong> This proposal is valid for {{terms.validityDays}} days from the date of issue.</p>

      {{#if terms.notes}}
      <p><strong>Additional Notes:</strong></p>
      <p>{{terms.notes}}</p>
      {{/if}}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>WastePH - Professional Waste Management Solutions</strong></p>
      <p>Email: info@wasteph.com | Phone: +63 XXX XXXX</p>
      <p style="margin-top: 15px; font-size: 11px;">
        Thank you for considering WastePH for your waste management needs. We look forward to serving you.
      </p>
    </div>
  </div>
</body>
</html>
`;

async function updateTemplateColors() {
  try {
    console.log("🎨 Updating proposal template colors to dark green...");

    // Find the default template
    const [defaultTemplate] = await db
      .select()
      .from(proposalTemplateTable)
      .where(eq(proposalTemplateTable.isDefault, true))
      .limit(1);

    if (!defaultTemplate) {
      console.log("❌ No default template found. Please run seedProposalTemplate.js first.");
      process.exit(1);
    }

    // Update the template
    const [updated] = await db
      .update(proposalTemplateTable)
      .set({
        htmlTemplate: updatedTemplateHTML,
        updatedAt: new Date(),
      })
      .where(eq(proposalTemplateTable.id, defaultTemplate.id))
      .returning();

    console.log("✅ Proposal template colors updated successfully!");
    console.log(`   Template ID: ${updated.id}`);
    console.log(`   Template Name: ${updated.name}`);
    console.log(`   Colors changed from blue (#2c5282) to dark green (#166534)`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating template colors:", error);
    process.exit(1);
  }
}

// Run the update function
updateTemplateColors();
