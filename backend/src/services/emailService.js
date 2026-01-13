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
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Send proposal email with PDF attachment
   * @param {string} to - Recipient email
   * @param {Object} proposalData - Proposal data
   * @param {Object} inquiryData - Inquiry data for client info
   * @param {Buffer} pdfBuffer - PDF buffer
   * @returns {Promise<Object>} Email result
   */
  async sendProposalEmail(to, proposalData, inquiryData, pdfBuffer) {
    try {
      const { pricing, terms } = proposalData;
      const clientName = inquiryData.name;

      // Calculate validity date
      const validityDate = new Date();
      validityDate.setDate(validityDate.getDate() + (terms.validityDays || 30));

      // Generate email HTML
      const htmlContent = this.generateProposalEmailHTML(
        clientName,
        pricing.total,
        validityDate.toLocaleDateString("en-PH")
      );

      // Send email with PDF attachment
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"WastePH" <noreply@wasteph.com>',
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

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("Email send error:", error);
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
        from: process.env.EMAIL_FROM || '"WastePH" <noreply@wasteph.com>',
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
   * Generate proposal email HTML using template literals
   * @param {string} clientName - Client name
   * @param {number} total - Total amount
   * @param {string} validityDate - Validity date string
   * @returns {string} HTML content
   */
  generateProposalEmailHTML(clientName, total, validityDate) {
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
        <tr>
          <td>Valid Until:</td>
          <td>${validityDate}</td>
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
