import nodemailer from "nodemailer";
import { AppError } from "../middleware/errorHandler.js";

/**
 * EmailService - Handle all email sending operations
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer transporter
   */
  initializeTransporter() {
    // Log SMTP configuration (without password)
    console.log("📧 Initializing Email Service...");
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || "NOT SET"}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || "587 (default)"}`);
    console.log(
      `   SMTP_SECURE: ${process.env.SMTP_SECURE || "false (default)"}`,
    );
    console.log(`   SMTP_USER: ${process.env.SMTP_USER || "NOT SET"}`);
    console.log(
      `   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? "****" : "NOT SET"}`,
    );

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASSWORD
    ) {
      console.warn(
        "⚠️  Warning: SMTP credentials not fully configured. Emails will fail.",
      );
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection on startup
    this.verifyConnection();
  }

  /**
   * Send proposal email with PDF attachment
   * @param {string} to - Recipient email
   * @param {Object} proposalData - Proposal data
   * @param {Object} inquiryData - Inquiry data for client info
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} proposalId - Proposal UUID for response links
   * @param {string} responseToken - Secure token for client response
   * @returns {Promise<Object>} Email result
   */
  async sendProposalEmail(
    to,
    proposalData,
    inquiryData,
    pdfBuffer,
    proposalId,
    responseToken,
  ) {
    try {
      // Handle both old format (pricing/terms objects) and new format (flat structure with editedHtmlContent)
      const isNewFormat = !!proposalData.editedHtmlContent;

      let clientName, total;

      if (isNewFormat) {
        // New simplified format
        clientName = proposalData.clientName || inquiryData.name;
        total = null; // New format doesn't have a computed total
      } else {
        // Legacy format with pricing/terms objects
        const { pricing } = proposalData;
        clientName = inquiryData.name;
        total = pricing?.total;
      }

      // Compute validity date for email
      const validityDays = proposalData.terms?.validityDays || 30;
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + validityDays);
      const validUntilStr = validUntilDate.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Generate email HTML
      const htmlContent = isNewFormat
        ? this.generateSimpleProposalEmailHTML(
            clientName,
            proposalId,
            responseToken,
            validUntilStr,
          )
        : this.generateProposalEmailHTML(
            clientName,
            total,
            proposalId,
            responseToken,
            validUntilStr,
          );

      // Send email with PDF attachment
      console.log(`📤 Sending proposal email to: ${to}`);
      console.log(`   From: ${process.env.SMTP_USER}`);
      console.log(
        `   PDF attached: ${pdfBuffer ? `Yes (${pdfBuffer.length} bytes)` : "No"}`,
      );

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: "Proposal from WastePH",
        html: htmlContent,
        attachments: [
          {
            filename: "WastePH_Proposal.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      console.log(`✅ Email sent successfully!`);
      console.log(`   Message ID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("❌ Email send error:", error.message);
      console.error("   Full error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send generic notification email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} body - Email body (plain text or HTML)
   * @returns {Promise<Object>} Email result
   */
  async sendNotificationEmail(to, subject, body) {
    try {
      const htmlContent = this.generateNotificationEmailHTML(subject, body);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html: htmlContent,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("Notification email error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate simple proposal email HTML for new format (without total)
   * @param {string} clientName - Client name
   * @param {string} proposalId - Proposal UUID
   * @param {string} responseToken - Secure token for client response
   * @returns {string} HTML content
   */
  generateSimpleProposalEmailHTML(
    clientName,
    proposalId,
    responseToken,
    validUntilStr,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #f9fafb;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .logo-section {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      padding: 32px 32px 28px 32px;
      text-align: center;
      border-bottom: 2px solid #16a34a;
    }
    .logo-text {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -0.05em;
      text-transform: uppercase;
      margin: 0 0 6px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1;
    }
    .logo-waste {
      color: #166534;
    }
    .logo-bullet {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #16a34a;
      border-radius: 50%;
      margin: 0 5px;
      vertical-align: middle;
    }
    .logo-ph {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .logo-tagline {
      color: #15803d;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin: 0;
    }
    .header {
      padding: 28px 32px 24px 32px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
    }
    .badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #166534;
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      font-weight: 400;
    }
    .content {
      padding: 24px 32px;
      background: #ffffff;
    }
    .content p {
      margin: 14px 0;
      color: #374151;
      font-size: 14px;
      line-height: 1.6;
    }
    .content ul {
      margin: 16px 0;
      padding-left: 24px;
      color: #374151;
    }
    .content li {
      margin: 8px 0;
      font-size: 14px;
    }
    .validity-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 18px 20px;
      margin: 20px 0;
      text-align: center;
    }
    .validity-box p {
      margin: 0;
      color: #166534;
      font-size: 14px;
    }
    .validity-box strong {
      font-size: 16px;
      color: #15803d;
    }
    .action-section {
      padding: 24px 32px 32px 32px;
      background: #fafafa;
    }
    .action-text {
      text-align: center;
      margin-bottom: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .btn-table {
      width: 100%;
      border-collapse: collapse;
    }
    .btn-table a {
      display: block;
      width: 100%;
      padding: 14px 32px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      color: #ffffff !important;
      text-align: center;
      border-radius: 8px;
      letter-spacing: 0.025em;
      transition: all 0.2s ease;
    }
    .btn-approve {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
    }
    .btn-reject {
      background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
    }
    .btn-table tr + tr td {
      padding-top: 12px;
    }
    .footer {
      text-align: center;
      padding: 24px 32px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
      margin: 4px 0;
    }
    .footer strong {
      color: #166534;
    }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 10px !important; }
      .logo-section { padding: 24px 16px 20px 16px !important; }
      .logo-text { font-size: 32px !important; }
      .logo-bullet { width: 5px !important; height: 5px !important; margin: 0 4px !important; }
      .logo-tagline { font-size: 8px !important; letter-spacing: 0.25em !important; margin-top: 4px !important; }
      .header, .content, .action-section { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      h1 { font-size: 22px !important; }
      .btn-table a { padding: 12px 24px !important; font-size: 13px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <div class="container">
          <!-- Logo -->
          <div class="logo-section">
            <h1 class="logo-text">
              <span class="logo-waste">WASTE</span><span class="logo-bullet"></span><span class="logo-ph">PH</span>
            </h1>
            <p class="logo-tagline">Private Waste Management</p>
          </div>

          <!-- Header -->
          <div class="header">
            <span class="badge">Business Proposal</span>
            <h1>Waste Management Solutions</h1>
            <p class="subtitle">Professional services tailored for your needs</p>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Dear <strong>${clientName}</strong>,</p>

            <p>Thank you for your interest in our waste management services. We are pleased to submit our proposal for your review.</p>

            <p>Please find attached our detailed proposal outlining the services we can provide, pricing structure, and terms and conditions.</p>

            <p><strong style="color: #166534;">The attached PDF contains:</strong></p>
            <ul>
              <li>Service breakdown and specifications</li>
              <li>Detailed pricing structure</li>
              <li>Terms and conditions</li>
              <li>Payment terms</li>
            </ul>

            <p>Should you have any questions or require clarification on any aspect of this proposal, please do not hesitate to contact us.</p>

            <p>We look forward to the opportunity to serve you.</p>

            <div class="validity-box">
              <p>This proposal is valid until <strong>${validUntilStr}</strong></p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-section">
            <p class="action-text"><strong>Please review the attached proposal and let us know your decision:</strong></p>
            <table class="btn-table" role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <a href="${frontendUrl}/proposal-response/${proposalId}/approve?token=${responseToken}" class="btn-approve">Accept Proposal →</a>
                </td>
              </tr>
              <tr>
                <td>
                  <a href="${frontendUrl}/proposal-response/${proposalId}/reject?token=${responseToken}" class="btn-reject">Decline Proposal</a>
                </td>
              </tr>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>WastePH - Private Waste Management</strong></p>
            <p>Email: info@wasteph.com | Phone: +639562461503</p>
            <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">
              This is an automated email. Please do not reply directly to this message.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate proposal email HTML using template literals
   * @param {string} clientName - Client name
   * @param {number} total - Total amount
   * @param {string} proposalId - Proposal UUID
   * @param {string} responseToken - Secure token for client response
   * @returns {string} HTML content
   */
  generateProposalEmailHTML(
    clientName,
    total,
    proposalId,
    responseToken,
    validUntilStr,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #f9fafb;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .logo-section {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      padding: 32px 32px 28px 32px;
      text-align: center;
      border-bottom: 2px solid #16a34a;
    }
    .logo-text {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -0.05em;
      text-transform: uppercase;
      margin: 0 0 6px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1;
    }
    .logo-waste {
      color: #166534;
    }
    .logo-bullet {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #16a34a;
      border-radius: 50%;
      margin: 0 5px;
      vertical-align: middle;
    }
    .logo-ph {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .logo-tagline {
      color: #15803d;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin: 0;
    }
    .header {
      padding: 28px 32px 24px 32px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
    }
    .badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #166534;
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      font-weight: 400;
    }
    .content {
      padding: 24px 32px;
      background: #ffffff;
    }
    .content p {
      margin: 14px 0;
      color: #374151;
      font-size: 14px;
      line-height: 1.6;
    }
    .content ul {
      margin: 16px 0;
      padding-left: 24px;
      color: #374151;
    }
    .content li {
      margin: 8px 0;
      font-size: 14px;
    }
    .summary-section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .summary-title {
      color: #166534;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }
    .summary-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .summary-table tr:last-child td {
      border-bottom: none;
    }
    .summary-table td:first-child {
      font-weight: 600;
      color: #6b7280;
    }
    .summary-table td:last-child {
      text-align: right;
      color: #166534;
      font-weight: 700;
      font-size: 18px;
    }
    .validity-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 18px 20px;
      margin: 20px 0;
      text-align: center;
    }
    .validity-box p {
      margin: 0;
      color: #166534;
      font-size: 14px;
    }
    .validity-box strong {
      font-size: 16px;
      color: #15803d;
    }
    .action-section {
      padding: 24px 32px 32px 32px;
      background: #fafafa;
    }
    .action-text {
      text-align: center;
      margin-bottom: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .btn-table {
      width: 100%;
      border-collapse: collapse;
    }
    .btn-table a {
      display: block;
      width: 100%;
      padding: 14px 32px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      color: #ffffff !important;
      text-align: center;
      border-radius: 8px;
      letter-spacing: 0.025em;
      transition: all 0.2s ease;
    }
    .btn-approve {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
    }
    .btn-reject {
      background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
    }
    .btn-table tr + tr td {
      padding-top: 12px;
    }
    .footer {
      text-align: center;
      padding: 24px 32px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
      margin: 4px 0;
    }
    .footer strong {
      color: #166534;
    }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 10px !important; }
      .logo-section { padding: 24px 16px 20px 16px !important; }
      .logo-text { font-size: 32px !important; }
      .logo-bullet { width: 5px !important; height: 5px !important; margin: 0 4px !important; }
      .logo-tagline { font-size: 8px !important; letter-spacing: 0.25em !important; margin-top: 4px !important; }
      .header, .content, .action-section { padding: 20px 16px !important; }
      .summary-section { padding: 16px !important; }
      .footer { padding: 20px 16px !important; }
      h1 { font-size: 22px !important; }
      .btn-table a { padding: 12px 24px !important; font-size: 13px !important; }
      .summary-table td:last-child { font-size: 16px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <div class="container">
          <!-- Logo -->
          <div class="logo-section">
            <h1 class="logo-text">
              <span class="logo-waste">WASTE</span><span class="logo-bullet"></span><span class="logo-ph">PH</span>
            </h1>
            <p class="logo-tagline">Private Waste Management</p>
          </div>

          <!-- Header -->
          <div class="header">
            <span class="badge">Business Proposal</span>
            <h1>Private Waste Management</h1>
            <p class="subtitle">Professional services tailored for your needs</p>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Dear <strong>${clientName}</strong>,</p>

            <p>Thank you for your interest in our waste management services. We are pleased to submit our proposal for your review.</p>

            <p>Please find attached our detailed proposal outlining the services we can provide, pricing structure, and terms and conditions.</p>

            <!-- Summary Section -->
            <div class="summary-section">
              <div class="summary-title">Proposal Summary</div>
              <table class="summary-table" cellpadding="0" cellspacing="0">
                <tr>
                  <td>Total Investment:</td>
                  <td>₱${Number(total).toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="validity-box">
              <p>This proposal is valid until <strong>${validUntilStr}</strong></p>
            </div>

            <p><strong style="color: #166534;">The attached PDF contains:</strong></p>
            <ul>
              <li>Service breakdown and specifications</li>
              <li>Detailed pricing structure</li>
              <li>Terms and conditions</li>
              <li>Payment terms</li>
            </ul>

            <p>Should you have any questions or require clarification on any aspect of this proposal, please do not hesitate to contact us.</p>

            <p>We look forward to the opportunity to serve you.</p>
          </div>

          <!-- Action Buttons -->
          <div class="action-section">
            <p class="action-text"><strong>Please review the attached proposal and let us know your decision:</strong></p>
            <table class="btn-table" role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <a href="${frontendUrl}/proposal-response/${proposalId}/approve?token=${responseToken}" class="btn-approve">Accept Proposal →</a>
                </td>
              </tr>
              <tr>
                <td>
                  <a href="${frontendUrl}/proposal-response/${proposalId}/reject?token=${responseToken}" class="btn-reject">Decline Proposal</a>
                </td>
              </tr>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>WastePH - Private Waste Management</strong></p>
            <p>Email: info@wasteph.com | Phone: +639562461503</p>
            <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">
              This is an automated email. Please do not reply directly to this message.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate notification email HTML
   * @param {string} subject - Email subject
   * @param {string} body - Email body content
   * @returns {string} HTML content
   */
  generateNotificationEmailHTML(subject, body) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 3px solid #2c5282;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .header h2 {
      color: #2c5282;
      margin: 0;
    }
    .content {
      margin-bottom: 25px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${subject}</h2>
    </div>
    <div class="content">
      <p>${body}</p>
    </div>
    <div class="footer">
      <p><strong>WastePH</strong></p>
      <p>Email: info@wasteph.com | Phone: +639562461503</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Verify SMTP connection
   * @returns {Promise<boolean>} Connection status
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ SMTP connection verified");
      return true;
    } catch (error) {
      console.error("❌ SMTP connection failed:", error);
      return false;
    }
  }

  /**
   * Send contract to client via email
   * @param {string} to - Client email address
   * @param {Object} proposalData - Proposal data
   * @param {Object} inquiryData - Inquiry data
   * @param {Buffer} pdfBuffer - Contract PDF buffer
   * @returns {Promise<Object>} Email result
   */
  async sendContractToClientEmail(
    to,
    proposalData,
    inquiryData,
    pdfBuffer,
    contractId,
    responseToken,
    contractNumber = null,
  ) {
    try {
      // Handle both old format and new format
      const isNewFormat = !!proposalData.editedHtmlContent;
      const clientName = isNewFormat
        ? proposalData.clientName || inquiryData.name
        : inquiryData.name;

      // Generate email HTML
      const htmlContent = this.generateContractEmailHTML(
        clientName,
        contractId,
        responseToken,
        contractNumber,
      );

      // Build subject and filename with contract number
      const subject = contractNumber
        ? `Contract ${contractNumber} - WastePH`
        : "Contract from WastePH";
      const pdfFilename = contractNumber
        ? `WastePH_Contract_${contractNumber}.pdf`
        : "WastePH_Contract.pdf";

      // Send email with PDF attachment
      console.log(`Sending contract email to: ${to}`);
      console.log(`   Contract: ${contractNumber || "N/A"}`);
      console.log(
        `   PDF attached: ${pdfBuffer ? `Yes (${pdfBuffer.length} bytes)` : "No"}`,
      );

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html: htmlContent,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      console.log(`✅ Contract email sent successfully!`);
      console.log(`   Message ID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("❌ Contract email send error:", error.message);
      console.error("   Full error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate contract email HTML
   * @param {string} clientName - Client name
   * @returns {string} HTML content
   */
  generateContractEmailHTML(
    clientName,
    contractId,
    responseToken,
    contractNumber = null,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #f9fafb;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .logo-section {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      padding: 32px 32px 28px 32px;
      text-align: center;
      border-bottom: 2px solid #16a34a;
    }
    .logo-text {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -0.05em;
      text-transform: uppercase;
      margin: 0 0 6px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1;
    }
    .logo-waste {
      color: #166534;
    }
    .logo-bullet {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #16a34a;
      border-radius: 50%;
      margin: 0 5px;
      vertical-align: middle;
    }
    .logo-ph {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .logo-tagline {
      color: #15803d;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin: 0;
    }
    .header {
      padding: 28px 32px 24px 32px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
    }
    .badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #166534;
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      font-weight: 400;
    }
    .content {
      padding: 24px 32px 32px 32px;
      background: #ffffff;
    }
    .content p {
      margin: 14px 0;
      color: #374151;
      font-size: 14px;
      line-height: 1.6;
    }
    .highlight-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 18px 20px;
      margin: 20px 0;
    }
    .highlight-box p {
      margin: 8px 0;
      color: #166534;
      font-size: 14px;
      line-height: 1.5;
    }
    .highlight-box p:first-child {
      margin-top: 0;
    }
    .highlight-box p:last-child {
      margin-bottom: 0;
    }
    .action-section {
      text-align: center;
      margin: 24px 0;
    }
    .btn-upload {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.025em;
      transition: all 0.2s ease;
    }
    .upload-icon {
      margin-right: 8px;
      display: inline-flex;
    }
    .note-text {
      font-size: 13px;
      color: #6b7280;
      margin-top: 16px;
    }
    .footer {
      text-align: center;
      padding: 24px 32px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
      margin: 4px 0;
    }
    .footer strong {
      color: #166534;
    }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 10px !important; }
      .logo-section { padding: 24px 16px 20px 16px !important; }
      .logo-text { font-size: 32px !important; }
      .logo-bullet { width: 5px !important; height: 5px !important; margin: 0 4px !important; }
      .logo-tagline { font-size: 8px !important; letter-spacing: 0.25em !important; margin-top: 4px !important; }
      .header, .content { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      h1 { font-size: 22px !important; }
      .btn-upload { padding: 12px 24px !important; font-size: 13px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <div class="container">
          <!-- Logo -->
          <div class="logo-section">
            <h1 class="logo-text">
              <span class="logo-waste">WASTE</span><span class="logo-bullet"></span><span class="logo-ph">PH</span>
            </h1>
            <p class="logo-tagline">Private Waste Management</p>
          </div>

          <!-- Header -->
          <div class="header">
            <span class="badge">Contract Ready</span>
            <h1>Your Contract is Ready!</h1>
            <p class="subtitle">Please review and sign your service agreement</p>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Dear <strong>${clientName}</strong>,</p>

            <p>Thank you for your continued interest in our services. We are pleased to provide you with your finalized contract.</p>

            <div class="highlight-box">
              ${contractNumber ? `<p style="font-weight: 600;"><strong style="color: #15803d;">Contract No:</strong> ${contractNumber}</p>` : ""}
              <p><strong style="color: #15803d;">Your contract is attached to this email as a PDF document.</strong></p>
              <p>Please review the contract carefully and contact us if you have any questions.</p>
            </div>

            <p>Once you have reviewed and signed the contract, please upload your signed copy using the button below:</p>

            <div class="action-section">
              <a href="${frontendUrl}/contract-response/${contractId}?token=${responseToken}" class="btn-upload">
                <span class="upload-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </span>
                Upload Signed Contract →
              </a>
            </div>

            <p class="note-text">You will be taken to a secure page where you can upload your signed contract document.</p>

            <p>We look forward to serving you and providing excellent waste management solutions for your needs.</p>

            <p style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <strong style="color: #166534;">Best regards,</strong><br>
              <span style="color: #6b7280;">The WastePH Team</span>
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>WastePH - Private Waste Management</strong></p>
            <p>Email: info@wasteph.com | Phone: +639562461503</p>
            <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">
              This is an automated email. Please do not reply directly to this message.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Send new lead notification email to all sales users
   * @param {string} to - Recipient email
   * @param {Object} leadData - Lead data
   * @returns {Promise<Object>} Email result
   */
  async sendNewLeadNotification(to, leadData) {
    try {
      const subject = `New Lead: ${leadData.companyName || leadData.name}`;
      const htmlContent = this.generateNewLeadEmailHTML(leadData);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ New lead notification sent to: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send new lead notification to ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate new lead notification email HTML
   * @param {Object} leadData - Lead data
   * @returns {string} HTML content
   */
  generateNewLeadEmailHTML(leadData) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const { name, email, phoneNumber, companyName, serviceInterest, message } =
      leadData;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #ffffff;
      background-color: #0a0a0a;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #0a0a0a;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #111111;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #1f1f1f;
    }
    .logo-section {
      background: linear-gradient(135deg, #0f2618 0%, #0a1f0f 100%);
      padding: 32px 32px 28px 32px;
      text-align: center;
      border-bottom: 1px solid #15803d;
    }
    .logo-text {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -0.05em;
      text-transform: uppercase;
      margin: 0 0 6px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1;
    }
    .logo-waste {
      color: #ffffff;
    }
    .logo-bullet {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #16a34a;
      border-radius: 50%;
      margin: 0 5px;
      vertical-align: middle;
    }
    .logo-ph {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .logo-tagline {
      color: #15803d;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin: 0;
    }
    .header {
      padding: 28px 32px 24px 32px;
      border-bottom: 1px solid #1f1f1f;
    }
    .status-badge {
      display: inline-block;
      background: #15803d;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }
    .subtitle {
      color: #9ca3af;
      font-size: 14px;
      font-weight: 400;
    }
    .content {
      padding: 24px 32px 32px 32px;
    }
    .data-grid {
      width: 100%;
      margin: 20px 0;
      background: #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #262626;
    }
    .data-row td {
      padding: 14px 20px;
      border-bottom: 1px solid #262626;
      font-size: 14px;
    }
    .data-row:last-child td {
      border-bottom: none;
    }
    .label {
      color: #737373;
      width: 110px;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .value {
      color: #f5f5f5;
      font-weight: 500;
    }
    .message-section {
      background: #1a1a1a;
      border: 1px solid #15803d;
      border-radius: 8px;
      padding: 18px 20px;
      margin-top: 20px;
    }
    .message-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #16a34a;
      margin-bottom: 10px;
      display: block;
      font-weight: 700;
    }
    .btn {
      display: inline-block;
      background: #16a34a;
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin: 24px 0 20px 0;
      letter-spacing: 0.025em;
      transition: background 0.2s ease;
    }
    .tip-section {
      background: #1a1a1a;
      border-left: 3px solid #16a34a;
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      padding: 24px 32px;
      background: #0a0a0a;
      border-top: 1px solid #1f1f1f;
    }
    .footer p {
      color: #737373;
      font-size: 12px;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 10px !important; }
      .logo-section { padding: 24px 16px 20px 16px !important; }
      .logo-text { font-size: 32px !important; }
      .logo-bullet { width: 5px !important; height: 5px !important; margin: 0 4px !important; }
      .logo-tagline { font-size: 8px !important; letter-spacing: 0.25em !important; margin-top: 4px !important; }
      .header, .content { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      .header h1 { font-size: 22px !important; }
      .data-row td { padding: 12px 14px !important; font-size: 13px !important; }
      .btn { padding: 12px 28px !important; font-size: 13px !important; }
      .tip-section { padding: 14px 16px !important; font-size: 13px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <div class="container">
          <!-- Logo -->
          <div class="logo-section">
            <h1 class="logo-text">
              <span class="logo-waste">WASTE</span><span class="logo-bullet"></span><span class="logo-ph">PH</span>
            </h1>
            <p class="logo-tagline">Private Waste Management</p>
          </div>

          <!-- Header -->
          <div class="header">
            <span class="status-badge">New Inquiry</span>
            <h1>New Lead Received</h1>
            <p class="subtitle">A new submission from your landing page</p>
          </div>

          <!-- Content -->
          <div class="content">
            <table class="data-grid" cellpadding="0" cellspacing="0">
              <tr class="data-row">
                <td class="label">Contact</td>
                <td class="value">${name}</td>
              </tr>
              ${companyName ? `<tr class="data-row"><td class="label">Company</td><td class="value">${companyName}</td></tr>` : ""}
              <tr class="data-row">
                <td class="label">Email</td>
                <td class="value"><a href="mailto:${email}" style="color: #22c55e; text-decoration: none;">${email}</a></td>
              </tr>
              ${phoneNumber ? `<tr class="data-row"><td class="label">Phone</td><td class="value">${phoneNumber}</td></tr>` : ""}
              ${serviceInterest ? `<tr class="data-row"><td class="label">Interest</td><td class="value">${serviceInterest}</td></tr>` : ""}
            </table>

            ${
              message
                ? `
            <div class="message-section">
              <span class="message-label">Message</span>
              <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            `
                : ""
            }

            <div style="text-align: center;">
              <a href="${frontendUrl}/admin/leads" class="btn">View in CRM →</a>
            </div>

            <div class="tip-section">
              <p style="font-size: 13px; color: #e5e5e5; margin: 0; line-height: 1.5;">
                <strong style="color: #22c55e;">Tip:</strong> Responding within 5 minutes increases conversion by 900%.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; font-weight: 600;">WastePH CRM</p>
            <p style="margin: 0; font-size: 12px; color: #525252;">Automated Lead Notification System</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
  /**
   * Send proposal response notification to sales person
   * @param {string} to - Sales person email
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Email result
   */
  async sendProposalResponseNotification(to, data) {
    try {
      const { clientName, proposalNumber, action, companyName } = data;
      const subject =
        action === "accepted"
          ? `Proposal Accepted: ${companyName || clientName}`
          : `Proposal Declined: ${companyName || clientName}`;

      const htmlContent = this.generateProposalResponseEmailHTML(data);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Proposal ${action} notification sent to: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send proposal response notification to ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate proposal response email HTML
   * @param {Object} data - Notification data
   * @returns {string} HTML content
   */
  generateProposalResponseEmailHTML(data) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const { clientName, proposalNumber, action, companyName, clientEmail } =
      data;
    const isAccepted = action === "accepted";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #ffffff;
      background-color: #0a0a0a;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #0a0a0a;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #111111;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #1f1f1f;
    }
    .logo-section {
      background: linear-gradient(135deg, #0f2618 0%, #0a1f0f 100%);
      padding: 32px 32px 28px 32px;
      text-align: center;
      border-bottom: 1px solid #15803d;
    }
    .logo-text {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -0.05em;
      text-transform: uppercase;
      margin: 0 0 6px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1;
    }
    .logo-waste {
      color: #ffffff;
    }
    .logo-bullet {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #16a34a;
      border-radius: 50%;
      margin: 0 5px;
      vertical-align: middle;
    }
    .logo-ph {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .logo-tagline {
      color: #15803d;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin: 0;
    }
    .header {
      padding: 28px 32px 24px 32px;
      border-bottom: 1px solid #1f1f1f;
    }
    .status-badge {
      display: inline-block;
      background: ${isAccepted ? "#15803d" : "#991b1b"};
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: ${isAccepted ? "#22c55e" : "#ef4444"};
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }
    .subtitle {
      color: #9ca3af;
      font-size: 14px;
      font-weight: 400;
    }
    .content {
      padding: 24px 32px 32px 32px;
    }
    .data-grid {
      width: 100%;
      margin: 20px 0;
      background: #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #262626;
    }
    .data-row td {
      padding: 14px 20px;
      border-bottom: 1px solid #262626;
      font-size: 14px;
    }
    .data-row:last-child td {
      border-bottom: none;
    }
    .label {
      color: #737373;
      width: 110px;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .value {
      color: #f5f5f5;
      font-weight: 500;
    }
    .highlight-box {
      background: ${isAccepted ? "#0f2618" : "#2d1212"};
      border: 1px solid ${isAccepted ? "#15803d" : "#991b1b"};
      border-radius: 8px;
      padding: 18px 20px;
      margin-top: 20px;
    }
    .btn {
      display: inline-block;
      background: ${isAccepted ? "#16a34a" : "#dc2626"};
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin: 24px 0 20px 0;
      letter-spacing: 0.025em;
      transition: background 0.2s ease;
    }
    .next-steps {
      background: #1a1a1a;
      border-left: 3px solid ${isAccepted ? "#16a34a" : "#dc2626"};
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      padding: 24px 32px;
      background: #0a0a0a;
      border-top: 1px solid #1f1f1f;
    }
    .footer p {
      color: #737373;
      font-size: 12px;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 10px !important; }
      .logo-section { padding: 24px 16px 20px 16px !important; }
      .logo-text { font-size: 32px !important; }
      .logo-bullet { width: 5px !important; height: 5px !important; margin: 0 4px !important; }
      .logo-tagline { font-size: 8px !important; letter-spacing: 0.25em !important; margin-top: 4px !important; }
      .header, .content { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      .header h1 { font-size: 22px !important; }
      .data-row td { padding: 12px 14px !important; font-size: 13px !important; }
      .btn { padding: 12px 28px !important; font-size: 13px !important; }
      .next-steps { padding: 14px 16px !important; font-size: 13px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <div class="container">
          <!-- Logo -->
          <div class="logo-section">
            <h1 class="logo-text">
              <span class="logo-waste">WASTE</span><span class="logo-bullet"></span><span class="logo-ph">PH</span>
            </h1>
            <p class="logo-tagline">Private Waste Management</p>
          </div>

          <!-- Header -->
          <div class="header">
            <span class="status-badge">${isAccepted ? "Action Required" : "Follow-Up Needed"}</span>
            <h1>Proposal ${isAccepted ? "Accepted" : "Declined"}</h1>
            <p class="subtitle">Client has responded to your proposal</p>
          </div>

          <!-- Content -->
          <div class="content">
            <table class="data-grid" cellpadding="0" cellspacing="0">
              <tr class="data-row">
                <td class="label">Proposal</td>
                <td class="value">${proposalNumber}</td>
              </tr>
              <tr class="data-row">
                <td class="label">Client</td>
                <td class="value">${clientName}</td>
              </tr>
              ${companyName ? `<tr class="data-row"><td class="label">Company</td><td class="value">${companyName}</td></tr>` : ""}
              <tr class="data-row">
                <td class="label">Email</td>
                <td class="value"><a href="mailto:${clientEmail}" style="color: #22c55e; text-decoration: none;">${clientEmail}</a></td>
              </tr>
              <tr class="data-row">
                <td class="label">Status</td>
                <td class="value" style="color: ${isAccepted ? "#22c55e" : "#ef4444"}; font-weight: 700;">${isAccepted ? "ACCEPTED" : "DECLINED"}</td>
              </tr>
            </table>

            <div class="highlight-box">
              <p style="font-size: 14px; color: #e5e5e5; margin: 0; line-height: 1.6;">
                ${
                  isAccepted
                    ? `<strong style="color: #22c55e;">Great news!</strong> The client has accepted your proposal.`
                    : `<strong style="color: #ef4444;">The client has declined this proposal.</strong> Consider reaching out to understand their concerns and see if you can provide an alternative solution.`
                }
              </p>
            </div>

            <div style="text-align: center;">
              <a href="${frontendUrl}/admin/proposals" class="btn">View in CRM →</a>
            </div>

            <div class="next-steps">
              <p style="font-size: 13px; color: #e5e5e5; margin: 0; line-height: 1.5;">
                <strong style="color: ${isAccepted ? "#22c55e" : "#ef4444"};">${isAccepted ? "Next Steps:" : "Suggested Actions:"}</strong><br>
                ${
                  isAccepted
                    ? `• Contract has been auto-created (status: pending_request)<br>• Request contract generation from admin<br>• Once approved, send contract to client`
                    : `• Reach out to understand concerns<br>• Offer alternative solutions or pricing<br>• Schedule a follow-up meeting`
                }
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; font-weight: 600;">WastePH CRM</p>
            <p style="margin: 0; font-size: 12px; color: #525252;">Automated Proposal Notification System</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Send contract signed notification to sales person
   * @param {string} to - Sales person email
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Email result
   */
  async sendContractSignedNotification(to, data) {
    try {
      const { clientName, contractNumber, companyName } = data;
      const subject = `Contract Signed: ${companyName || clientName}`;
      const htmlContent = this.generateContractSignedEmailHTML(data);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Contract signed notification sent to: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send contract signed notification to ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate contract signed email HTML
   * @param {Object} data - Notification data
   * @returns {string} HTML content
   */
  generateContractSignedEmailHTML(data) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const {
      clientName,
      contractNumber,
      companyName,
      clientEmail,
      address,
      contractStartDate,
      contractEndDate,
    } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #ffffff;
      background-color: #0a0a0a;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #0a0a0a;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #111111;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #1f1f1f;
    }
    .logo-section {
      background: linear-gradient(135deg, #0f2618 0%, #0a1f0f 100%);
      padding: 32px 32px 28px 32px;
      text-align: center;
      border-bottom: 1px solid #15803d;
    }
    .logo-text {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -0.05em;
      text-transform: uppercase;
      margin: 0 0 6px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1;
    }
    .logo-waste {
      color: #ffffff;
    }
    .logo-bullet {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #16a34a;
      border-radius: 50%;
      margin: 0 5px;
      vertical-align: middle;
    }
    .logo-ph {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .logo-tagline {
      color: #15803d;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin: 0;
    }
    .header {
      padding: 28px 32px 24px 32px;
      border-bottom: 1px solid #1f1f1f;
    }
    .status-badge {
      display: inline-block;
      background: #15803d;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #22c55e;
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }
    .subtitle {
      color: #9ca3af;
      font-size: 14px;
      font-weight: 400;
    }
    .content {
      padding: 24px 32px 32px 32px;
    }
    .data-grid {
      width: 100%;
      margin: 20px 0;
      background: #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #262626;
    }
    .data-row td {
      padding: 14px 20px;
      border-bottom: 1px solid #262626;
      font-size: 14px;
    }
    .data-row:last-child td {
      border-bottom: none;
    }
    .label {
      color: #737373;
      width: 110px;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .value {
      color: #f5f5f5;
      font-weight: 500;
    }
    .highlight-box {
      background: #0f2618;
      border: 1px solid #15803d;
      border-radius: 8px;
      padding: 18px 20px;
      margin-top: 20px;
    }
    .btn {
      display: inline-block;
      background: #16a34a;
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin: 24px 0 20px 0;
      letter-spacing: 0.025em;
      transition: background 0.2s ease;
    }
    .next-steps {
      background: #1a1a1a;
      border-left: 3px solid #16a34a;
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      padding: 24px 32px;
      background: #0a0a0a;
      border-top: 1px solid #1f1f1f;
    }
    .footer p {
      color: #737373;
      font-size: 12px;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 10px !important; }
      .logo-section { padding: 24px 16px 20px 16px !important; }
      .logo-text { font-size: 32px !important; }
      .logo-bullet { width: 5px !important; height: 5px !important; margin: 0 4px !important; }
      .logo-tagline { font-size: 8px !important; letter-spacing: 0.25em !important; margin-top: 4px !important; }
      .header, .content { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      .header h1 { font-size: 22px !important; }
      .data-row td { padding: 12px 14px !important; font-size: 13px !important; }
      .btn { padding: 12px 28px !important; font-size: 13px !important; }
      .next-steps { padding: 14px 16px !important; font-size: 13px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <div class="container">
          <!-- Logo -->
          <div class="logo-section">
            <h1 class="logo-text">
              <span class="logo-waste">WASTE</span><span class="logo-bullet"></span><span class="logo-ph">PH</span>
            </h1>
            <p class="logo-tagline">Private Waste Management</p>
          </div>

          <!-- Header -->
          <div class="header">
            <span class="status-badge">Deal Closed</span>
            <h1>Contract Signed</h1>
            <p class="subtitle">A new client has been created</p>
          </div>

          <!-- Content -->
          <div class="content">
            <table class="data-grid" cellpadding="0" cellspacing="0">
              <tr class="data-row">
                <td class="label">Contract</td>
                <td class="value">${contractNumber}</td>
              </tr>
              <tr class="data-row">
                <td class="label">Client</td>
                <td class="value">${clientName}</td>
              </tr>
              ${companyName ? `<tr class="data-row"><td class="label">Company</td><td class="value">${companyName}</td></tr>` : ""}
              <tr class="data-row">
                <td class="label">Email</td>
                <td class="value"><a href="mailto:${clientEmail}" style="color: #22c55e; text-decoration: none;">${clientEmail}</a></td>
              </tr>
              ${address ? `<tr class="data-row"><td class="label">Address</td><td class="value">${address}</td></tr>` : ""}
              ${contractStartDate ? `<tr class="data-row"><td class="label">Period</td><td class="value">${new Date(contractStartDate).toLocaleDateString("en-PH")} - ${new Date(contractEndDate).toLocaleDateString("en-PH")}</td></tr>` : ""}
            </table>

            <div class="highlight-box">
              <p style="font-size: 14px; color: #e5e5e5; margin: 0; line-height: 1.6;">
                <strong style="color: #22c55e;">Congratulations!</strong> The client has uploaded their signed contract and a new client record has been automatically created in the system.
              </p>
            </div>

            <div style="text-align: center;">
              <a href="${frontendUrl}/admin/clients" class="btn">View Client in CRM →</a>
            </div>

            <div class="next-steps">
              <p style="font-size: 13px; color: #e5e5e5; margin: 0; line-height: 1.5;">
                <strong style="color: #22c55e;">Next Steps:</strong><br>
                • Schedule monthly check-ins with the client<br>
                • Set up service schedules and collection points<br>
                • Send welcome/onboarding materials<br>
                • Ensure all documentation is complete
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; font-weight: 600;">WastePH CRM</p>
            <p style="margin: 0; font-size: 12px; color: #525252;">Automated Contract Notification System</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}

export default new EmailService();
