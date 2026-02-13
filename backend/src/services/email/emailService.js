import nodemailer from "nodemailer";
import { getEnv } from "../../utils/envValidator.js";
import settingsService from "../settingsService.js";

// Import all email templates
import {
  generateSimpleProposalEmailHTML,
  generateProposalEmailHTML,
  generateContractEmailHTML,
  generateNotificationEmailHTML,
  generateAutoScheduleClientEmailHTML,
  generateNewLeadEmailHTML,
  generateProposalResponseEmailHTML,
  generateProposalRequestedEmailHTML,
  generateProposalApprovedEmailHTML,
  generateProposalDisapprovedEmailHTML,
  generateContractSignedEmailHTML,
  generateNewTicketEmailHTML,
  generateTicketUpdateEmailHTML,
  generateEventAssignedEmailHTML,
  generateEventReminderEmailHTML,
  generateAutoScheduleSalesEmailHTML,
} from "./templates/index.js";

/**
 * EmailService - Handle all email sending operations
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Get SMTP configuration from database or environment
   * Priority: Database > Environment Variables
   * @returns {Promise<Object>}
   */
  async getSMTPConfig() {
    try {
      // Try to get settings from database first
      const dbSettings = await settingsService.getSMTPSettings();

      if (dbSettings && dbSettings.host && dbSettings.user && dbSettings.password) {
        console.log("📧 Using SMTP settings from database");
        return {
          host: dbSettings.host,
          port: parseInt(dbSettings.port || "587"),
          secure: dbSettings.secure === "true" || dbSettings.secure === true,
          user: dbSettings.user,
          password: dbSettings.password,
          from_name: dbSettings.from_name || "WastePH",
        };
      }
    } catch (error) {
      console.warn("⚠️  Could not load SMTP settings from database, falling back to .env");
    }

    // Fallback to environment variables
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(getEnv("SMTP_PORT", "587")),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from_name: getEnv("SMTP_FROM_NAME", "WastePH"),
    };
  }

  /**
   * Initialize Nodemailer transporter
   */
  async initializeTransporter() {
    // Get SMTP configuration (DB or env)
    const config = await this.getSMTPConfig();

    // Log SMTP configuration (without password)
    console.log("📧 Initializing Email Service...");
    console.log(`   SMTP_HOST: ${config.host || "NOT SET"}`);
    console.log(`   SMTP_PORT: ${config.port || "587 (default)"}`);
    console.log(`   SMTP_SECURE: ${config.secure}`);
    console.log(`   SMTP_USER: ${config.user || "NOT SET"}`);
    console.log(`   SMTP_PASSWORD: ${config.password ? "****" : "NOT SET"}`);
    console.log(`   FROM_NAME: ${config.from_name}`);

    if (!config.host || !config.user || !config.password) {
      console.warn(
        "⚠️  Warning: SMTP credentials not fully configured. Emails will fail.",
      );
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    // Store config for use in email sending
    this.config = config;

    // Verify connection on startup
    this.verifyConnection();
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

  // ---------------------------------------------------------------------------
  // Send methods
  // ---------------------------------------------------------------------------

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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
   * Send contract to client via email
   * @param {string} to - Client email address
   * @param {Object} proposalData - Proposal data
   * @param {Object} inquiryData - Inquiry data
   * @param {Buffer} pdfBuffer - Contract PDF buffer
   * @param {string} contractId - Contract UUID
   * @param {string} responseToken - Secure token for client response
   * @param {string|null} contractNumber - Contract number
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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
   * Send proposal requested notification to admins (sales → admin)
   * @param {Array<string>} toList - Array of admin emails
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Email result
   */
  async sendProposalRequestedNotification(toList, data) {
    try {
      const { inquiryName, inquiryCompany, proposalNumber } = data;
      const subject = `New Proposal Request: ${inquiryCompany || inquiryName}`;
      const htmlContent = generateProposalRequestedEmailHTML(data);

      // Send to all admins in parallel
      const emailPromises = toList.map((to) =>
        this.transporter.sendMail({
          from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
          to,
          subject,
          html: htmlContent,
        }).catch((error) => {
          console.error(`❌ Failed to send to ${to}:`, error.message);
          return { error: error.message, to };
        })
      );

      const results = await Promise.all(emailPromises);
      const successful = results.filter((r) => !r.error);
      const failed = results.filter((r) => r.error);

      console.log(
        `✅ Proposal requested notification sent to ${successful.length}/${toList.length} admins`
      );

      if (failed.length > 0) {
        console.warn(`⚠️ Failed to send to: ${failed.map((f) => f.to).join(", ")}`);
      }

      return {
        success: true,
        sentCount: successful.length,
        failedCount: failed.length,
        failed: failed.map((f) => f.to),
      };
    } catch (error) {
      console.error(
        "❌ Failed to send proposal requested notifications:",
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send proposal approved notification to sales person (admin approval)
   * @param {string} to - Sales person email
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Email result
   */
  async sendProposalApprovedNotification(to, data) {
    try {
      const { clientName, companyName, proposalNumber } = data;
      const subject = `Proposal Approved: ${companyName || clientName}`;
      const htmlContent = this.generateProposalApprovedEmailHTML(data);

      const info = await this.transporter.sendMail({
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Proposal approved notification sent to: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send proposal approved notification to ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send proposal disapproved notification to sales person (admin rejection)
   * @param {string} to - Sales person email
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Email result
   */
  async sendProposalDisapprovedNotification(to, data) {
    try {
      const { clientName, companyName, proposalNumber } = data;
      const subject = `Proposal Disapproved: ${companyName || clientName}`;
      const htmlContent = this.generateProposalDisapprovedEmailHTML(data);

      const info = await this.transporter.sendMail({
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Proposal disapproved notification sent to: ${to}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send proposal disapproved notification to ${to}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
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
        from: `${this.config?.from_name || "WastePH"} <${this.config?.user || process.env.SMTP_USER}>`,
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

  // ---------------------------------------------------------------------------
  // Template generation methods (delegated to standalone template modules)
  // Kept as class methods for backward compatibility with emailPreviewController
  // ---------------------------------------------------------------------------

  generateSimpleProposalEmailHTML(...args) {
    return generateSimpleProposalEmailHTML(...args);
  }

  generateProposalEmailHTML(...args) {
    return generateProposalEmailHTML(...args);
  }

  generateContractEmailHTML(...args) {
    return generateContractEmailHTML(...args);
  }

  generateNotificationEmailHTML(...args) {
    return generateNotificationEmailHTML(...args);
  }

  generateAutoScheduleClientEmailHTML(...args) {
    return generateAutoScheduleClientEmailHTML(...args);
  }

  generateNewLeadEmailHTML(...args) {
    return generateNewLeadEmailHTML(...args);
  }

  generateProposalResponseEmailHTML(...args) {
    return generateProposalResponseEmailHTML(...args);
  }

  generateProposalRequestedEmailHTML(...args) {
    return generateProposalRequestedEmailHTML(...args);
  }

  generateProposalApprovedEmailHTML(...args) {
    return generateProposalApprovedEmailHTML(...args);
  }

  generateProposalDisapprovedEmailHTML(...args) {
    return generateProposalDisapprovedEmailHTML(...args);
  }

  generateContractSignedEmailHTML(...args) {
    return generateContractSignedEmailHTML(...args);
  }

  generateNewTicketEmailHTML(...args) {
    return generateNewTicketEmailHTML(...args);
  }

  generateTicketUpdateEmailHTML(...args) {
    return generateTicketUpdateEmailHTML(...args);
  }

  generateEventAssignedEmailHTML(...args) {
    return generateEventAssignedEmailHTML(...args);
  }

  generateEventReminderEmailHTML(...args) {
    return generateEventReminderEmailHTML(...args);
  }

  generateAutoScheduleSalesEmailHTML(...args) {
    return generateAutoScheduleSalesEmailHTML(...args);
  }
}

export default new EmailService();
