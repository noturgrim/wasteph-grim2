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
    console.log(`   SMTP_SECURE: ${process.env.SMTP_SECURE || "false (default)"}`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER || "NOT SET"}`);
    console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? "****" : "NOT SET"}`);

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn("⚠️  Warning: SMTP credentials not fully configured. Emails will fail.");
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
  async sendProposalEmail(to, proposalData, inquiryData, pdfBuffer, proposalId, responseToken) {
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

      // Generate email HTML
      const htmlContent = isNewFormat
        ? this.generateSimpleProposalEmailHTML(clientName, proposalId, responseToken)
        : this.generateProposalEmailHTML(clientName, total, proposalId, responseToken);

      // Send email with PDF attachment
      console.log(`📤 Sending proposal email to: ${to}`);
      console.log(`   From: ${process.env.SMTP_USER}`);
      console.log(`   PDF attached: ${pdfBuffer ? `Yes (${pdfBuffer.length} bytes)` : "No"}`);

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
  generateSimpleProposalEmailHTML(clientName, proposalId, responseToken) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
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
      text-align: center;
      border-bottom: 3px solid #106934;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #106934;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }
    .content {
      margin-bottom: 30px;
    }
    .content p {
      margin: 15px 0;
    }
    .validity-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .validity-box p {
      margin: 0;
      color: #166534;
    }
    .validity-box strong {
      font-size: 18px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer strong {
      color: #106934;
    }
    .action-buttons {
      text-align: center;
      margin: 30px 0;
      padding: 20px 0;
    }
    .btn {
      display: inline-block;
      padding: 14px 35px;
      margin: 0 10px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      font-size: 16px;
      transition: opacity 0.3s;
    }
    .btn:hover {
      opacity: 0.8;
    }
    .btn-approve {
      background-color: #10b981;
      color: #ffffff;
    }
    .btn-reject {
      background-color: #ef4444;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Business Proposal</h1>
      <p>Thank you for considering WastePH for your waste management needs</p>
    </div>

    <div class="content">
      <p>Dear <strong>${clientName}</strong>,</p>

      <p>Thank you for your interest in our waste management services. We are pleased to submit our proposal for your review.</p>

      <p>Please find attached our detailed proposal outlining the services we can provide, pricing structure, and terms and conditions.</p>

      <p>The attached PDF contains complete details including:</p>
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Service breakdown and specifications</li>
        <li>Detailed pricing structure</li>
        <li>Terms and conditions</li>
        <li>Payment terms</li>
      </ul>

      <p>Should you have any questions or require clarification on any aspect of this proposal, please do not hesitate to contact us.</p>

      <p>We look forward to the opportunity to serve you.</p>
    </div>

    <div class="action-buttons">
      <p style="margin-bottom: 20px; color: #666;">Please review the attached proposal and let us know your decision:</p>
      <a href="${frontendUrl}/proposal-response/${proposalId}/approve?token=${responseToken}" class="btn btn-approve">✓ Approve Proposal</a>
      <a href="${frontendUrl}/proposal-response/${proposalId}/reject?token=${responseToken}" class="btn btn-reject">✗ Reject Proposal</a>
    </div>

    <div class="footer">
      <p><strong>WastePH - Professional Waste Management Solutions</strong></p>
      <p>Email: info@wasteph.com | Phone: +639562461503</p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        This is an automated email. Please do not reply directly to this message.
      </p>
    </div>
  </div>
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
  generateProposalEmailHTML(clientName, total, proposalId, responseToken) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
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
      text-align: center;
      border-bottom: 3px solid #2c5282;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2c5282;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }
    .content {
      margin-bottom: 30px;
    }
    .content p {
      margin: 15px 0;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: #f8f9fa;
      border-radius: 4px;
      overflow: hidden;
    }
    .summary-table td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }
    .summary-table td:first-child {
      font-weight: bold;
      color: #555;
    }
    .summary-table td:last-child {
      text-align: right;
      color: #2c5282;
      font-weight: bold;
    }
    .summary-table tr:last-child td {
      border-bottom: none;
    }
    .cta-button {
      display: inline-block;
      background: #2c5282;
      color: #ffffff;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: bold;
    }
    .cta-button:hover {
      background: #1e3a5f;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer strong {
      color: #2c5282;
    }
    .action-buttons {
      text-align: center;
      margin: 30px 0;
      padding: 20px 0;
    }
    .btn {
      display: inline-block;
      padding: 14px 35px;
      margin: 0 10px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      font-size: 16px;
      transition: opacity 0.3s;
    }
    .btn:hover {
      opacity: 0.8;
    }
    .btn-approve {
      background-color: #10b981;
      color: #ffffff;
    }
    .btn-reject {
      background-color: #ef4444;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Business Proposal</h1>
      <p>Thank you for considering WastePH for your waste management needs</p>
    </div>

    <div class="content">
      <p>Dear <strong>${clientName}</strong>,</p>

      <p>Thank you for your interest in our waste management services. We are pleased to submit our proposal for your review.</p>

      <p>Please find attached our detailed proposal outlining the services we can provide, pricing structure, and terms and conditions.</p>

      <h3 style="color: #2c5282; margin-top: 30px;">Proposal Summary</h3>
      <table class="summary-table">
        <tr>
          <td>Total Investment:</td>
          <td>₱${Number(total).toFixed(2)}</td>
        </tr>
      </table>

      <p>The attached PDF contains complete details including:</p>
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Service breakdown and specifications</li>
        <li>Detailed pricing structure</li>
        <li>Terms and conditions</li>
        <li>Payment terms</li>
      </ul>

      <p>Should you have any questions or require clarification on any aspect of this proposal, please do not hesitate to contact us.</p>

      <p>We look forward to the opportunity to serve you.</p>
    </div>

    <div class="action-buttons">
      <p style="margin-bottom: 20px; color: #666;">Please review the attached proposal and let us know your decision:</p>
      <a href="${frontendUrl}/proposal-response/${proposalId}/approve?token=${responseToken}" class="btn btn-approve">✓ Approve Proposal</a>
      <a href="${frontendUrl}/proposal-response/${proposalId}/reject?token=${responseToken}" class="btn btn-reject">✗ Reject Proposal</a>
    </div>

    <div class="footer">
      <p><strong>WastePH - Professional Waste Management Solutions</strong></p>
      <p>Email: info@wasteph.com | Phone: +639562461503</p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        This is an automated email. Please do not reply directly to this message.
      </p>
    </div>
  </div>
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
}

export default new EmailService();
