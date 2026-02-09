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
            <a href="${frontendUrl}/proposal-response/${proposalId}/approve?token=${responseToken}" class="btn-approve">Approve Proposal</a>
          </td>
        </tr>
        <tr>
          <td>
            <a href="${frontendUrl}/proposal-response/${proposalId}/reject?token=${responseToken}" class="btn-reject">Reject Proposal</a>
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
            <a href="${frontendUrl}/proposal-response/${proposalId}/approve?token=${responseToken}" class="btn-approve">Approve Proposal</a>
          </td>
        </tr>
        <tr>
          <td>
            <a href="${frontendUrl}/proposal-response/${proposalId}/reject?token=${responseToken}" class="btn-reject">Reject Proposal</a>
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
      console.error(`❌ Failed to send new lead notification to ${to}:`, error.message);
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
    const { name, email, phoneNumber, companyName, serviceInterest, message } = leadData;

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
      font-size: 26px;
    }
    .header p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      margin-top: 10px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    }
    .info-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-table td:first-child {
      font-weight: bold;
      color: #555;
      width: 140px;
    }
    .info-table tr:last-child td {
      border-bottom: none;
    }
    .message-box {
      background: #f0fdf4;
      border-left: 4px solid #166534;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .message-box p {
      margin: 0;
      color: #166534;
    }
    .cta-button {
      display: inline-block;
      background: #106934;
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 15px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
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
      <h1>New Lead Received</h1>
      <p>A new lead has been submitted from the landing page</p>
      <span class="badge">REQUIRES ATTENTION</span>
    </div>

    <table class="info-table">
      <tr>
        <td>Contact Name:</td>
        <td><strong>${name}</strong></td>
      </tr>
      ${companyName ? `<tr><td>Company:</td><td><strong>${companyName}</strong></td></tr>` : ""}
      <tr>
        <td>Email:</td>
        <td><a href="mailto:${email}" style="color: #106934;">${email}</a></td>
      </tr>
      ${phoneNumber ? `<tr><td>Phone:</td><td>${phoneNumber}</td></tr>` : ""}
      ${serviceInterest ? `<tr><td>Service Interest:</td><td>${serviceInterest}</td></tr>` : ""}
    </table>

    ${message ? `
    <div class="message-box">
      <p style="font-weight: bold; margin-bottom: 8px;">Message:</p>
      <p style="white-space: pre-wrap;">${message}</p>
    </div>
    ` : ""}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${frontendUrl}/admin/leads" class="cta-button">View Lead in CRM</a>
    </div>

    <p style="font-size: 13px; color: #666; margin-top: 20px;">
      <strong>Next Steps:</strong><br>
      • Claim this lead in the CRM<br>
      • Reach out within 24 hours for best conversion<br>
      • Qualify and convert to an inquiry
    </p>

    <div class="footer">
      <p><strong>WastePH CRM</strong> - Lead Notification System</p>
      <p style="margin-top: 10px; font-size: 11px; color: #999;">
        This is an automated notification. Do not reply to this email.
      </p>
    </div>
  </div>
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
      const subject = action === "accepted" 
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
      console.error(`❌ Failed to send proposal response notification to ${to}:`, error.message);
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
    const { clientName, proposalNumber, action, companyName, clientEmail } = data;
    const isAccepted = action === "accepted";

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
      border-bottom: 3px solid ${isAccepted ? "#16a34a" : "#dc2626"};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: ${isAccepted ? "#16a34a" : "#dc2626"};
      margin: 0 0 10px 0;
      font-size: 26px;
    }
    .badge {
      display: inline-block;
      background: ${isAccepted ? "#dcfce7" : "#fee2e2"};
      color: ${isAccepted ? "#166534" : "#991b1b"};
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      margin-top: 10px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    }
    .info-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-table td:first-child {
      font-weight: bold;
      color: #555;
      width: 140px;
    }
    .info-table tr:last-child td {
      border-bottom: none;
    }
    .highlight-box {
      background: ${isAccepted ? "#f0fdf4" : "#fef2f2"};
      border-left: 4px solid ${isAccepted ? "#16a34a" : "#dc2626"};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .cta-button {
      display: inline-block;
      background: ${isAccepted ? "#16a34a" : "#dc2626"};
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 15px;
      font-weight: bold;
      margin: 20px 0;
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
      <h1>Proposal ${isAccepted ? "Accepted" : "Declined"}</h1>
      <p>Client has responded to your proposal</p>
      <span class="badge">${isAccepted ? "ACTION REQUIRED" : "FOLLOW-UP NEEDED"}</span>
    </div>

    <table class="info-table">
      <tr>
        <td>Proposal:</td>
        <td><strong>${proposalNumber}</strong></td>
      </tr>
      <tr>
        <td>Client:</td>
        <td><strong>${clientName}</strong></td>
      </tr>
      ${companyName ? `<tr><td>Company:</td><td>${companyName}</td></tr>` : ""}
      <tr>
        <td>Email:</td>
        <td><a href="mailto:${clientEmail}" style="color: #106934;">${clientEmail}</a></td>
      </tr>
      <tr>
        <td>Status:</td>
        <td><strong style="color: ${isAccepted ? "#16a34a" : "#dc2626"};">${isAccepted ? "ACCEPTED" : "DECLINED"}</strong></td>
      </tr>
    </table>

    <div class="highlight-box">
      ${isAccepted 
        ? `<p><strong>Great news!</strong> The client has accepted your proposal. A contract will be automatically generated and is now pending admin approval.</p>`
        : `<p><strong>The client has declined this proposal.</strong> Consider reaching out to understand their concerns and see if you can provide an alternative solution.</p>`
      }
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${frontendUrl}/admin/proposals" class="cta-button">View in CRM</a>
    </div>

    ${isAccepted ? `
    <p style="font-size: 13px; color: #666; margin-top: 20px;">
      <strong>Next Steps:</strong><br>
      • Contract has been auto-created (status: pending_request)<br>
      • Request contract generation from admin<br>
      • Once approved, send contract to client
    </p>
    ` : `
    <p style="font-size: 13px; color: #666; margin-top: 20px;">
      <strong>Suggested Actions:</strong><br>
      • Reach out to understand concerns<br>
      • Offer alternative solutions or pricing<br>
      • Schedule a follow-up meeting
    </p>
    `}

    <div class="footer">
      <p><strong>WastePH CRM</strong> - Proposal Notification System</p>
      <p style="margin-top: 10px; font-size: 11px; color: #999;">
        This is an automated notification. Do not reply to this email.
      </p>
    </div>
  </div>
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
      console.error(`❌ Failed to send contract signed notification to ${to}:`, error.message);
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
    const { clientName, contractNumber, companyName, clientEmail, address, contractStartDate, contractEndDate } = data;

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
      border-bottom: 3px solid #16a34a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #16a34a;
      margin: 0 0 10px 0;
      font-size: 26px;
    }
    .badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      margin-top: 10px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    }
    .info-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-table td:first-child {
      font-weight: bold;
      color: #555;
      width: 140px;
    }
    .info-table tr:last-child td {
      border-bottom: none;
    }
    .highlight-box {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .cta-button {
      display: inline-block;
      background: #16a34a;
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 15px;
      font-weight: bold;
      margin: 20px 0;
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
      <h1>Contract Signed</h1>
      <p>A new client has been created</p>
      <span class="badge">DEAL CLOSED</span>
    </div>

    <table class="info-table">
      <tr>
        <td>Contract:</td>
        <td><strong>${contractNumber}</strong></td>
      </tr>
      <tr>
        <td>Client:</td>
        <td><strong>${clientName}</strong></td>
      </tr>
      ${companyName ? `<tr><td>Company:</td><td>${companyName}</td></tr>` : ""}
      <tr>
        <td>Email:</td>
        <td><a href="mailto:${clientEmail}" style="color: #106934;">${clientEmail}</a></td>
      </tr>
      ${address ? `<tr><td>Address:</td><td>${address}</td></tr>` : ""}
      ${contractStartDate ? `<tr><td>Contract Period:</td><td>${new Date(contractStartDate).toLocaleDateString("en-PH")} - ${new Date(contractEndDate).toLocaleDateString("en-PH")}</td></tr>` : ""}
    </table>

    <div class="highlight-box">
      <p><strong>Congratulations!</strong> The client has uploaded their signed contract and a new client record has been automatically created in the system.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${frontendUrl}/admin/clients" class="cta-button">View Client in CRM</a>
    </div>

    <p style="font-size: 13px; color: #666; margin-top: 20px;">
      <strong>Next Steps:</strong><br>
      • Schedule monthly check-ins with the client<br>
      • Set up service schedules and collection points<br>
      • Send welcome/onboarding materials<br>
      • Ensure all documentation is complete
    </p>

    <div class="footer">
      <p><strong>WastePH CRM</strong> - Contract Notification System</p>
      <p style="margin-top: 10px; font-size: 11px; color: #999;">
        This is an automated notification. Do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export default new EmailService();
