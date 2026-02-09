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
   * Send auto-schedule notification to sales person
   * @param {string} to - Sales person email
   * @param {Object} data - { events, contractNumber, companyName, salesPersonName }
   * @returns {Promise<Object>} Email result
   */
  async sendAutoScheduleNotificationToSales(to, data) {
    try {
      const { contractNumber, companyName, events } = data;
      const subject = `Auto-Schedule Created: ${events.length} events for ${companyName}`;

      const htmlContent = this.generateAutoScheduleSalesEmailHTML(data);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Auto-schedule notification sent to sales: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send auto-schedule notification to sales ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send auto-schedule notification to client
   * @param {string} to - Client email
   * @param {Object} data - { events, contractNumber, companyName, contactPerson }
   * @returns {Promise<Object>} Email result
   */
  async sendAutoScheduleNotificationToClient(to, data) {
    try {
      const { companyName, events } = data;
      const subject = `Scheduled Check-ins: ${companyName} - WastePH`;

      const htmlContent = this.generateAutoScheduleClientEmailHTML(data);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Auto-schedule notification sent to client: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send auto-schedule notification to client ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send event assigned notification (immediate)
   * @param {string} to - Assigned user email
   * @param {Object} data - Event data
   * @returns {Promise<Object>} Email result
   */
  async sendEventAssignedEmail(to, data) {
    try {
      const { title, scheduledDate } = data;
      const dateStr = new Date(scheduledDate).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const subject = `New Event: ${title} on ${dateStr}`;

      const htmlContent = this.generateEventAssignedEmailHTML(data);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Event assigned notification sent to: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send event assigned notification to ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send event reminder email
   * @param {string} to - User email
   * @param {Object} data - Event data
   * @param {string} timeType - '24h' or '1h'
   * @returns {Promise<Object>} Email result
   */
  async sendEventReminderEmail(to, data, timeType) {
    try {
      const { title, scheduledDate } = data;
      const dateStr = new Date(scheduledDate).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
      const timeLabel = timeType === "24h" ? "tomorrow" : "in 1 hour";
      const subject = `Reminder: ${title} ${timeLabel}`;

      const htmlContent = this.generateEventReminderEmailHTML(data, timeType);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Event ${timeType} reminder sent to: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send event ${timeType} reminder to ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send new ticket notification to admins
   * @param {string} to - Admin email
   * @param {Object} data - Ticket data
   * @returns {Promise<Object>} Email result
   */
  async sendNewTicketNotification(to, data) {
    try {
      const { ticketNumber, clientName, category, priority, subject } = data;
      const emailSubject = `New Ticket: ${ticketNumber} - ${subject}`;

      const htmlContent = this.generateNewTicketEmailHTML(data);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: emailSubject,
        html: htmlContent,
      });

      console.log(`✅ New ticket notification sent to: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send new ticket notification to ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send ticket update notification to sales person
   * @param {string} to - Sales person email
   * @param {Object} data - Ticket update data
   * @returns {Promise<Object>} Email result
   */
  async sendTicketUpdateNotification(to, data) {
    try {
      const { ticketNumber, updateType, subject } = data;
      const emailSubject = `Ticket Update: ${ticketNumber} - ${updateType}`;

      const htmlContent = this.generateTicketUpdateEmailHTML(data);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: emailSubject,
        html: htmlContent,
      });

      console.log(`✅ Ticket update notification sent to: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send ticket update notification to ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
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

  /**
   * Generate new ticket email HTML (for admins)
   * @param {Object} data - Ticket data
   * @returns {string} HTML content
   */
  generateNewTicketEmailHTML(data) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const {
      ticketNumber,
      ticketId,
      clientName,
      companyName,
      category,
      priority,
      subject,
      description,
      creatorName,
      contractNumber,
    } = data;

    const priorityColors = {
      low: { bg: "#1a1a1a", border: "#404040", text: "#9ca3af" },
      medium: { bg: "#1a2e1a", border: "#16a34a", text: "#22c55e" },
      high: { bg: "#2d1f1a", border: "#ea580c", text: "#fb923c" },
      urgent: { bg: "#2d1212", border: "#dc2626", text: "#ef4444" },
    };

    const categoryLabels = {
      technical: "Technical Issue",
      billing: "Billing",
      service_request: "Service Request",
      complaint: "Complaint",
      other: "Other",
    };

    const config = priorityColors[priority] || priorityColors.low;

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
    .priority-banner {
      background: ${config.bg};
      border: 1px solid ${config.border};
      border-radius: 8px;
      padding: 14px 20px;
      margin: 20px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .priority-label {
      color: ${config.text};
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
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
    .description-box {
      background: #1a1a1a;
      border: 1px solid #262626;
      border-radius: 8px;
      padding: 18px 20px;
      margin-top: 20px;
    }
    .description-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #9ca3af;
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
            <span class="status-badge">New Ticket</span>
            <h1>Support Ticket Created</h1>
            <p class="subtitle">A new ticket has been submitted and requires attention</p>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="priority-banner">
              <span class="priority-label">${priority.toUpperCase()} Priority</span>
            </div>

            <table class="data-grid" cellpadding="0" cellspacing="0">
              <tr class="data-row">
                <td class="label">Ticket #</td>
                <td class="value">${ticketNumber}</td>
              </tr>
              <tr class="data-row">
                <td class="label">Client</td>
                <td class="value">${clientName}${companyName ? ` (${companyName})` : ""}</td>
              </tr>
              ${contractNumber ? `<tr class="data-row"><td class="label">Contract</td><td class="value">${contractNumber}</td></tr>` : ""}
              <tr class="data-row">
                <td class="label">Category</td>
                <td class="value">${categoryLabels[category] || category}</td>
              </tr>
              <tr class="data-row">
                <td class="label">Created By</td>
                <td class="value">${creatorName}</td>
              </tr>
              <tr class="data-row">
                <td class="label">Subject</td>
                <td class="value">${subject}</td>
              </tr>
            </table>

            ${
              description
                ? `
            <div class="description-box">
              <span class="description-label">Description</span>
              <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${description}</p>
            </div>
            `
                : ""
            }

            <div style="text-align: center;">
              <a href="${frontendUrl}/admin/tickets" class="btn">View Ticket →</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; font-weight: 600;">WastePH CRM</p>
            <p style="margin: 0; font-size: 12px; color: #525252;">Automated Ticket Notification System</p>
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
   * Generate ticket update email HTML (for sales person)
   * @param {Object} data - Ticket update data
   * @returns {string} HTML content
   */
  generateTicketUpdateEmailHTML(data) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const {
      ticketNumber,
      ticketId,
      updateType,
      subject,
      oldStatus,
      newStatus,
      oldPriority,
      newPriority,
      commentText,
      commentAuthor,
      resolutionNotes,
    } = data;

    const statusColors = {
      open: { color: "#22c55e", label: "Open" },
      in_progress: { color: "#3b82f6", label: "In Progress" },
      resolved: { color: "#8b5cf6", label: "Resolved" },
      closed: { color: "#6b7280", label: "Closed" },
    };

    const priorityColors = {
      low: "#9ca3af",
      medium: "#22c55e",
      high: "#fb923c",
      urgent: "#ef4444",
    };

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
      background: #1e40af;
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
    .update-banner {
      background: #1a1a1a;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 18px 20px;
      margin: 20px 0;
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
    .change-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .change-arrow {
      color: #3b82f6;
    }
    .comment-box {
      background: #1a1a1a;
      border: 1px solid #262626;
      border-left: 3px solid #3b82f6;
      border-radius: 8px;
      padding: 18px 20px;
      margin-top: 20px;
    }
    .comment-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #3b82f6;
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
            <span class="status-badge">Ticket Update</span>
            <h1>Your Ticket Has Been Updated</h1>
            <p class="subtitle">Ticket #${ticketNumber} - ${subject}</p>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="update-banner">
              <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.6;">
                <strong style="color: #3b82f6;">${updateType === "status" ? "Status Changed" : updateType === "priority" ? "Priority Changed" : updateType === "comment" ? "New Comment Added" : "Ticket Updated"}</strong>
              </p>
            </div>

            ${
              updateType === "status" && oldStatus && newStatus
                ? `
            <table class="data-grid" cellpadding="0" cellspacing="0">
              <tr class="data-row">
                <td class="label">Status</td>
                <td class="value">
                  <div class="change-indicator">
                    <span style="color: ${statusColors[oldStatus]?.color || "#9ca3af"};">${statusColors[oldStatus]?.label || oldStatus}</span>
                    <span class="change-arrow">→</span>
                    <span style="color: ${statusColors[newStatus]?.color || "#9ca3af"}; font-weight: 700;">${statusColors[newStatus]?.label || newStatus}</span>
                  </div>
                </td>
              </tr>
            </table>
            ${
              resolutionNotes
                ? `
            <div class="comment-box">
              <span class="comment-label">Resolution Notes</span>
              <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${resolutionNotes}</p>
            </div>
            `
                : ""
            }
            `
                : ""
            }

            ${
              updateType === "priority" && oldPriority && newPriority
                ? `
            <table class="data-grid" cellpadding="0" cellspacing="0">
              <tr class="data-row">
                <td class="label">Priority</td>
                <td class="value">
                  <div class="change-indicator">
                    <span style="color: ${priorityColors[oldPriority] || "#9ca3af"};">${oldPriority.toUpperCase()}</span>
                    <span class="change-arrow">→</span>
                    <span style="color: ${priorityColors[newPriority] || "#9ca3af"}; font-weight: 700;">${newPriority.toUpperCase()}</span>
                  </div>
                </td>
              </tr>
            </table>
            `
                : ""
            }

            ${
              updateType === "comment" && commentText
                ? `
            <div class="comment-box">
              <span class="comment-label">New Comment${commentAuthor ? ` by ${commentAuthor}` : ""}</span>
              <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${commentText}</p>
            </div>
            `
                : ""
            }

            <div style="text-align: center;">
              <a href="${frontendUrl}/admin/tickets" class="btn">View Ticket →</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; font-weight: 600;">WastePH CRM</p>
            <p style="margin: 0; font-size: 12px; color: #525252;">Automated Ticket Notification System</p>
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
   * Generate event assigned email HTML
   * @param {Object} data - Event data
   * @returns {string} HTML content
   */
  generateEventAssignedEmailHTML(data) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const {
      title,
      description,
      eventType,
      scheduledDate,
      startTime,
      endTime,
      creatorName,
      clientName,
      companyName,
    } = data;

    const eventDate = new Date(scheduledDate);
    const dateStr = eventDate.toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const eventTypeLabels = {
      site_visit: "Site Visit",
      call: "Phone Call",
      meeting: "Meeting",
      follow_up: "Follow-up",
      client_checkup: "Client Check-in",
    };

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
    .event-card {
      background: #1a1a1a;
      border-left: 4px solid #16a34a;
      border-radius: 8px;
      padding: 20px 24px;
      margin: 24px 32px;
    }
    .event-title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
      letter-spacing: -0.025em;
    }
    .event-meta {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    }
    .meta-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: #16a34a;
    }
    .meta-label {
      color: #9ca3af;
      font-weight: 500;
    }
    .meta-value {
      color: #f5f5f5;
      font-weight: 500;
    }
    .description-box {
      background: #111111;
      border: 1px solid #262626;
      border-radius: 8px;
      padding: 18px 20px;
      margin: 20px 32px;
    }
    .description-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #9ca3af;
      margin-bottom: 10px;
      display: block;
      font-weight: 700;
    }
    .content {
      padding: 24px 32px 32px 32px;
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
      margin: 0;
      letter-spacing: 0.025em;
      transition: background 0.2s ease;
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
      .event-card, .description-box { margin: 20px 16px !important; padding: 16px !important; }
      .content { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      .event-title { font-size: 18px !important; }
      .btn { padding: 12px 28px !important; font-size: 13px !important; }
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
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">New Event Assigned</p>
            <h1 style="font-size: 16px; font-weight: 500; color: #9ca3af; margin: 0;">${creatorName} invited you to</h1>
          </div>

          <!-- Event Card (Google Calendar style) -->
          <div class="event-card">
            <h2 class="event-title">${title}</h2>
            
            <div class="event-meta">
              <div class="meta-row">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span class="meta-value">${dateStr}</span>
              </div>
              
              ${startTime ? `
              <div class="meta-row">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span class="meta-value">${startTime}${endTime ? ` – ${endTime}` : ""}</span>
              </div>
              ` : ""}
              
              ${eventType ? `
              <div class="meta-row">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span class="meta-value">${eventTypeLabels[eventType] || eventType}</span>
              </div>
              ` : ""}
              
              ${clientName ? `
              <div class="meta-row">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span class="meta-value">${clientName}${companyName ? ` (${companyName})` : ""}</span>
              </div>
              ` : ""}
            </div>
          </div>

          ${description ? `
          <div class="description-box">
            <span class="description-label">Description</span>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${description}</p>
          </div>
          ` : ""}

          <!-- Action -->
          <div class="content">
            <div style="text-align: center;">
              <a href="${frontendUrl}/admin/calendar" class="btn">View Calendar</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; font-weight: 600;">WastePH CRM</p>
            <p style="margin: 0; font-size: 12px; color: #525252;">Calendar Notification System</p>
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
   * Generate event reminder email HTML (Google Calendar style - light theme)
   * @param {Object} data - Event data
   * @param {string} timeType - '24h' or '1h'
   * @returns {string} HTML content
   */
  generateEventReminderEmailHTML(data, timeType) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const {
      title,
      description,
      eventType,
      scheduledDate,
      startTime,
      endTime,
      clientName,
      companyName,
      hoursUntil,
      minutesUntil,
    } = data;

    const eventDate = new Date(scheduledDate);
    const dateStr = eventDate.toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const dayStr = eventDate.toLocaleDateString("en-PH", {
      weekday: "short",
    });

    const monthDay = eventDate.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });

    const is24h = timeType === "24h";
    const reminderText = is24h ? "Tomorrow" : "Soon";
    const accentColor = is24h ? "#16a34a" : "#ea580c";

    const eventTypeLabels = {
      site_visit: "Site Visit",
      call: "Phone Call",
      meeting: "Meeting",
      follow_up: "Follow-up",
      client_checkup: "Client Check-in",
    };

    return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; mso-line-height-rule: exactly; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f8f9fa;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-collapse: collapse !important;
      border-spacing: 0 !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    td {
      border-collapse: collapse !important;
    }
    img {
      border: 0;
      display: block;
      outline: none;
      text-decoration: none;
    }
    p, h1, h2 {
      margin: 0;
      padding: 0;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .mobile-padding { padding: 20px !important; }
      .mobile-title { font-size: 20px !important; line-height: 1.4 !important; }
      .mobile-hide { display: none !important; }
      .mobile-full-width { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" class="mobile-full-width">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e8eaed;" class="mobile-padding">
              <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 700; color: #1f1f1f; letter-spacing: -0.5px; line-height: 1.2; mso-line-height-rule: exactly; font-family: Arial, Helvetica, sans-serif;">
                WASTE <span style="color: #16a34a;">• PH</span>
              </h1>
              <p style="margin: 0; font-size: 12px; color: #5f6368; letter-spacing: 0.3px; line-height: 1.4; font-family: Arial, Helvetica, sans-serif;">Private Waste Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 36px 40px;" class="mobile-padding">
              <!-- Reminder Label -->
              <p style="margin: 0 0 24px 0; font-size: 13px; font-weight: 600; color: ${accentColor}; text-transform: uppercase; letter-spacing: 1px; line-height: 1.4; font-family: Arial, Helvetica, sans-serif;">
                ${is24h ? "TOMORROW" : "COMING UP"}
              </p>
              
              <!-- Event Title -->
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 500; color: #202124; line-height: 1.3; mso-line-height-rule: exactly; font-family: Arial, Helvetica, sans-serif;" class="mobile-title">
                ${title}
              </h2>
              
              <!-- Event Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; border-left: 4px solid ${accentColor}; border-radius: 8px;">
                <tr>
                  <td style="padding: 24px;">
                    <!-- Date Section -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="70" valign="top" style="padding-right: 20px;">
                          <!-- Date Icon -->
                          <table role="presentation" width="64" height="64" cellpadding="0" cellspacing="0" border="0" style="background-color: ${accentColor}; border-radius: 8px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                            <tr>
                              <td align="center" valign="middle" style="padding: 8px;">
                                <p style="margin: 0; font-size: 11px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; font-family: Arial, Helvetica, sans-serif; mso-line-height-rule: exactly;">${dayStr.toUpperCase()}</p>
                                <p style="margin: 4px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.1; font-family: Arial, Helvetica, sans-serif; mso-line-height-rule: exactly;">${eventDate.getDate()}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding-top: 4px;">
                          <p style="margin: 0 0 4px 0; font-size: 17px; font-weight: 500; color: #202124; line-height: 1.4; font-family: Arial, Helvetica, sans-serif; mso-line-height-rule: exactly;">${monthDay}, ${eventDate.getFullYear()}</p>
                          <p style="margin: 0; font-size: 15px; color: #5f6368; line-height: 1.4; font-family: Arial, Helvetica, sans-serif;">${startTime ? `${startTime}${endTime ? ` – ${endTime}` : ""}` : "All day"}</p>
                        </td>
                      </tr>
                    </table>
                    
                    ${eventType || clientName ? `
                    <!-- Event Details -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e8eaed;">
                      ${eventType ? `
                      <tr>
                        <td style="padding: 8px 0 8px 0; font-size: 14px; color: #3c4043; line-height: 1.5;">
                          <strong style="color: #5f6368; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Type:</strong> ${eventTypeLabels[eventType] || eventType}
                        </td>
                      </tr>
                      ` : ""}
                      ${clientName ? `
                      <tr>
                        <td style="padding: 8px 0 8px 0; font-size: 14px; color: #3c4043; line-height: 1.5;">
                          <strong style="color: #5f6368; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Client:</strong> ${clientName}${companyName ? ` (${companyName})` : ""}
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                    ` : ""}
                  </td>
                </tr>
              </table>
              
              ${description ? `
              <!-- Description -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; background-color: #f8f9fa; border-radius: 8px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0; font-size: 15px; color: #3c4043; line-height: 1.7; font-family: Arial, Helvetica, sans-serif; mso-line-height-rule: exactly; white-space: pre-wrap;">${description}</p>
                  </td>
                </tr>
              </table>
              ` : ""}
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 36px;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${frontendUrl}/admin/calendar" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="13%" stroke="f" fillcolor="${accentColor}">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:500;">View in Calendar</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${frontendUrl}/admin/calendar" target="_blank" style="display: inline-block; background-color: ${accentColor}; color: #ffffff !important; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; letter-spacing: 0.3px; font-family: Arial, Helvetica, sans-serif; mso-hide: all;">View in Calendar</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 28px 40px; background-color: #f8f9fa; border-top: 1px solid #e8eaed; text-align: center;" class="mobile-padding">
              <p style="margin: 0; font-size: 13px; color: #5f6368; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                <strong style="color: #3c4043;">WastePH CRM</strong><br>
                Calendar Reminder System
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate auto-schedule notification email for sales person (light theme)
   * @param {Object} data - { events, contractNumber, companyName, salesPersonName }
   * @returns {string} HTML content
   */
  generateAutoScheduleSalesEmailHTML(data) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const { events, contractNumber, companyName, salesPersonName } = data;

    const eventListHTML = events
      .map((event) => {
        const eventDate = new Date(event.scheduledDate);
        const dateStr = eventDate.toLocaleDateString("en-PH", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const timeStr = event.startTime
          ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}`
          : "All day";

        return `
        <tr>
          <td style="padding: 16px 24px; border-bottom: 1px solid #e8eaed;">
            <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 500; color: #202124; font-family: Arial, Helvetica, sans-serif;">${dateStr}</p>
            <p style="margin: 0; font-size: 14px; color: #5f6368; font-family: Arial, Helvetica, sans-serif;">${timeStr}</p>
          </td>
        </tr>
        `;
      })
      .join("");

    return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; mso-line-height-rule: exactly; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f8f9fa;
      font-family: Arial, Helvetica, sans-serif;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e8eaed;">
              <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 700; color: #1f1f1f; letter-spacing: -0.5px; font-family: Arial, Helvetica, sans-serif;">
                WASTE <span style="color: #16a34a;">• PH</span>
              </h1>
              <p style="margin: 0; font-size: 12px; color: #5f6368; letter-spacing: 0.3px; font-family: Arial, Helvetica, sans-serif;">Private Waste Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 36px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: 600; color: #16a34a; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">
                AUTO-SCHEDULE CREATED
              </p>
              
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 500; color: #202124; line-height: 1.3; font-family: Arial, Helvetica, sans-serif;">
                ${events.length} Monthly Check-in${events.length > 1 ? "s" : ""} Scheduled
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #3c4043; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                Automatic monthly check-in events have been created for <strong>${companyName}</strong> (${contractNumber}).
              </p>
              
              <!-- Event List -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 24px;">
                ${eventListHTML}
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/admin/calendar" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff !important; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">View Calendar</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 28px 40px; background-color: #f8f9fa; border-top: 1px solid #e8eaed; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #5f6368; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                <strong style="color: #3c4043;">WastePH CRM</strong><br>
                Automated Scheduling System
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate auto-schedule notification email for client (light theme)
   * @param {Object} data - { events, contractNumber, companyName, contactPerson }
   * @returns {string} HTML content
   */
  generateAutoScheduleClientEmailHTML(data) {
    const { events, contractNumber, companyName, contactPerson } = data;

    const eventListHTML = events
      .map((event) => {
        const eventDate = new Date(event.scheduledDate);
        const dateStr = eventDate.toLocaleDateString("en-PH", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const timeStr = event.startTime
          ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}`
          : "All day";

        return `
        <tr>
          <td style="padding: 16px 24px; border-bottom: 1px solid #e8eaed;">
            <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 500; color: #202124; font-family: Arial, Helvetica, sans-serif;">${dateStr}</p>
            <p style="margin: 0; font-size: 14px; color: #5f6368; font-family: Arial, Helvetica, sans-serif;">${timeStr}</p>
          </td>
        </tr>
        `;
      })
      .join("");

    return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; mso-line-height-rule: exactly; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f8f9fa;
      font-family: Arial, Helvetica, sans-serif;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e8eaed;">
              <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 700; color: #1f1f1f; letter-spacing: -0.5px; font-family: Arial, Helvetica, sans-serif;">
                WASTE <span style="color: #16a34a;">• PH</span>
              </h1>
              <p style="margin: 0; font-size: 12px; color: #5f6368; letter-spacing: 0.3px; font-family: Arial, Helvetica, sans-serif;">Private Waste Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 500; color: #202124; line-height: 1.3; font-family: Arial, Helvetica, sans-serif;">
                Your Monthly Check-ins Have Been Scheduled
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #3c4043; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                Dear ${contactPerson || "Valued Client"},
              </p>
              
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #3c4043; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                We've scheduled <strong>${events.length} monthly check-in${events.length > 1 ? "s" : ""}</strong> for your account with us. These sessions are designed to ensure your service runs smoothly and address any concerns you may have.
              </p>
              
              <!-- Event List -->
              <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #5f6368; text-transform: uppercase; letter-spacing: 0.8px; font-family: Arial, Helvetica, sans-serif;">Scheduled Dates:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 28px; border: 1px solid #e8eaed;">
                ${eventListHTML}
              </table>
              
              <!-- Contact Message -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                      <strong style="color: #92400e;">Need to reschedule?</strong><br>
                      If you have concerns about these dates or need to make changes, please contact us and we'll be happy to accommodate your schedule.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #3c4043; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                We look forward to our continued partnership.
              </p>
              
              <p style="margin: 0; font-size: 14px; color: #5f6368; font-family: Arial, Helvetica, sans-serif;">
                Best regards,<br>
                <strong style="color: #3c4043;">WastePH Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 28px 40px; background-color: #f8f9fa; border-top: 1px solid #e8eaed; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #3c4043; font-family: Arial, Helvetica, sans-serif;">
                <strong>WastePH - Private Waste Management</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #5f6368; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                For support, contact us at ${process.env.SMTP_USER || "support@wasteph.com"}
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}

export default new EmailService();
