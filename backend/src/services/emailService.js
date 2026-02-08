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

      // Compute validity date for email
      const validityDays = proposalData.terms?.validityDays || 30;
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + validityDays);
      const validUntilStr = validUntilDate.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

      // Generate email HTML
      const htmlContent = isNewFormat
        ? this.generateSimpleProposalEmailHTML(clientName, proposalId, responseToken, validUntilStr)
        : this.generateProposalEmailHTML(clientName, total, proposalId, responseToken, validUntilStr);

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
  generateSimpleProposalEmailHTML(clientName, proposalId, responseToken, validUntilStr) {
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
      margin: 30px 0;
    }
    .action-buttons p {
      text-align: center;
      margin-bottom: 20px;
      color: #666;
    }
    .btn-table {
      width: 100%;
      border-collapse: collapse;
    }
    .btn-table a {
      display: block;
      width: 100%;
      padding: 14px 0;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      color: #ffffff !important;
      text-align: center;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .btn-table .btn-approve {
      background-color: #16a34a;
    }
    .btn-table .btn-reject {
      background-color: #dc2626;
    }
    .btn-table tr + tr td {
      padding-top: 10px;
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

    <div class="validity-box">
      <p>This proposal is valid until <strong>${validUntilStr}</strong></p>
    </div>

    <div class="action-buttons">
      <p>Please review the attached proposal and let us know your decision:</p>
      <table class="btn-table" role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <a href="${frontendUrl}/proposal-response/${proposalId}/approve?token=${responseToken}" class="btn-approve">✓ Approve Proposal</a>
          </td>
        </tr>
        <tr>
          <td>
            <a href="${frontendUrl}/proposal-response/${proposalId}/reject?token=${responseToken}" class="btn-reject">✗ Reject Proposal</a>
          </td>
        </tr>
      </table>
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
  generateProposalEmailHTML(clientName, total, proposalId, responseToken, validUntilStr) {
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
      margin: 30px 0;
    }
    .action-buttons p {
      text-align: center;
      margin-bottom: 20px;
      color: #666;
    }
    .btn-table {
      width: 100%;
      border-collapse: collapse;
    }
    .btn-table a {
      display: block;
      width: 100%;
      padding: 14px 0;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      color: #ffffff !important;
      text-align: center;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .btn-table .btn-approve {
      background-color: #16a34a;
    }
    .btn-table .btn-reject {
      background-color: #dc2626;
    }
    .btn-table tr + tr td {
      padding-top: 10px;
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

      <div class="validity-box">
        <p>This proposal is valid until <strong>${validUntilStr}</strong></p>
      </div>

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
      <p>Please review the attached proposal and let us know your decision:</p>
      <table class="btn-table" role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <a href="${frontendUrl}/proposal-response/${proposalId}/approve?token=${responseToken}" class="btn-approve">✓ Approve Proposal</a>
          </td>
        </tr>
        <tr>
          <td>
            <a href="${frontendUrl}/proposal-response/${proposalId}/reject?token=${responseToken}" class="btn-reject">✗ Reject Proposal</a>
          </td>
        </tr>
      </table>
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

  /**
   * Send contract to client via email
   * @param {string} to - Client email address
   * @param {Object} proposalData - Proposal data
   * @param {Object} inquiryData - Inquiry data
   * @param {Buffer} pdfBuffer - Contract PDF buffer
   * @returns {Promise<Object>} Email result
   */
  async sendContractToClientEmail(to, proposalData, inquiryData, pdfBuffer, contractId, responseToken, contractNumber = null) {
    try {
      // Handle both old format and new format
      const isNewFormat = !!proposalData.editedHtmlContent;
      const clientName = isNewFormat
        ? proposalData.clientName || inquiryData.name
        : inquiryData.name;

      // Generate email HTML
      const htmlContent = this.generateContractEmailHTML(clientName, contractId, responseToken, contractNumber);

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
      console.log(`   PDF attached: ${pdfBuffer ? `Yes (${pdfBuffer.length} bytes)` : "No"}`);

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
  generateContractEmailHTML(clientName, contractId, responseToken, contractNumber = null) {
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
    .highlight-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .highlight-box p {
      margin: 0;
      color: #166534;
    }
    .action-buttons {
      text-align: center;
      margin: 25px 0;
    }
    .btn-upload {
      display: inline-block;
      background-color: #106934;
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 14px 32px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: bold;
      margin: 5px;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Contract is Ready!</h1>
      <p>WastePH - Professional Waste Management Solutions</p>
    </div>

    <div class="content">
      <p>Dear ${clientName},</p>

      <p>Thank you for your continued interest in our services. We are pleased to provide you with your finalized contract.</p>

      <div class="highlight-box">
        ${contractNumber ? `<p style="margin-bottom: 8px; font-size: 13px; color: #166534;"><strong>Contract No:</strong> ${contractNumber}</p>` : ""}
        <p><strong>Your contract is attached to this email as a PDF document.</strong></p>
        <p style="margin-top: 10px; font-size: 14px;">Please review the contract carefully and contact us if you have any questions.</p>
      </div>

      <p>Once you have reviewed and signed the contract, please upload your signed copy using the button below:</p>

      <div class="action-buttons">
        <a href="${frontendUrl}/contract-response/${contractId}?token=${responseToken}" class="btn-upload">
          <span style="display: inline-block; vertical-align: middle; margin-right: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </span>
          Upload Signed Contract
        </a>
      </div>

      <p style="font-size: 13px; color: #888;">You will be taken to a secure page where you can upload your signed contract document.</p>

      <p>We look forward to serving you and providing excellent waste management solutions for your needs.</p>

      <p style="margin-top: 30px;">
        <strong>Best regards,</strong><br>
        The WastePH Team
      </p>
    </div>

    <div class="footer">
      <p><strong>WastePH</strong> | Professional Waste Management Services</p>
      <p>For questions or assistance, please contact our sales team.</p>
      <p style="margin-top: 15px; color: #999; font-size: 11px;">
        This email was sent automatically. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export default new EmailService();
