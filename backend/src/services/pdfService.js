import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import { AppError } from "../middleware/errorHandler.js";
import { registerHandlebarsHelpers } from "../utils/handlebarsHelpers.js";

/**
 * PDFService - Handle PDF generation from HTML templates
 */
class PDFService {
  constructor() {
    this._browser = null;
    registerHandlebarsHelpers();

    // Clean up the cached browser when the process exits
    const cleanup = () => this._destroyBrowser();
    process.on("exit", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("SIGINT", cleanup);
  }

  /**
   * Lazy-init and cache a Puppeteer browser instance.
   * @returns {Promise<import("puppeteer").Browser>}
   */
  async _getBrowser() {
    if (this._browser && this._browser.isConnected()) {
      return this._browser;
    }

    this._browser = await Promise.race([
      puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      }),
      this.timeout(10000, "Browser launch timeout"),
    ]);

    return this._browser;
  }

  /**
   * Close the cached browser (no-op if not open).
   */
  async _destroyBrowser() {
    if (this._browser) {
      await this._browser.close().catch(() => {});
      this._browser = null;
    }
  }

  /**
   * Core PDF generation: open a page, render HTML, capture PDF, close the page.
   * The browser stays alive for the next call.
   * @param {string} html - Fully rendered HTML string
   * @returns {Promise<Buffer>} PDF buffer
   */
  async _generatePdf(html) {
    let browser;
    let page;

    try {
      browser = await this._getBrowser();
      page = await browser.newPage();

      await Promise.race([
        page.setContent(html, { waitUntil: "networkidle0" }),
        this.timeout(15000, "Page load timeout"),
      ]);

      const pdfBuffer = await Promise.race([
        page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
        }),
        this.timeout(30000, "PDF generation timeout"),
      ]);

      return pdfBuffer;
    } catch (error) {
      // If the browser died (e.g. crash), drop the cached reference so it
      // gets re-created on the next call.  Don't close it here — it may
      // already be gone.
      if (browser && !browser.isConnected()) {
        this._browser = null;
      }
      throw new AppError(`PDF generation failed: ${error.message}`, 500);
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  /**
   * Generate PDF from proposal data and template
   * @param {Object} proposalData - Proposal data (services, pricing, terms)
   * @param {Object} inquiryData - Inquiry data for client info
   * @param {string} templateHtml - HTML template with Handlebars placeholders
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateProposalPDF(proposalData, inquiryData, templateHtml) {
    const templateData = this.prepareTemplateData(proposalData, inquiryData);
    const html = Handlebars.compile(templateHtml)(templateData);
    return this._generatePdf(html);
  }

  /**
   * Prepare data for template rendering
   * @param {Object} proposalData - Proposal data
   * @param {Object} inquiryData - Inquiry data
   * @returns {Object} Template data
   */
  prepareTemplateData(proposalData, inquiryData) {
    const { services, pricing, terms, ...rest } = proposalData;

    // Calculate dates
    const proposalDate = new Date();
    const validUntilDate = new Date();
    validUntilDate.setDate(
      validUntilDate.getDate() + (terms.validityDays || 30)
    );

    const baseData = {
      // Company info
      companyLogoUrl:
        process.env.COMPANY_LOGO_URL || "https://wasteph.com/logo.png",

      // Dates
      proposalDate: this.formatDate(proposalDate),
      validUntilDate: this.formatDate(validUntilDate),

      // Client information
      clientName: inquiryData.name || "Valued Client",
      clientPosition: inquiryData.position || "",
      clientCompany: inquiryData.company || "",
      clientAddress: inquiryData.address || "",
      clientEmail: inquiryData.email,
      clientPhone: inquiryData.phone || "N/A",

      // Services
      services: services.map((service) => ({
        ...service,
        unitPrice: Number(service.unitPrice),
        subtotal: Number(service.subtotal),
      })),

      // Pricing
      pricing: {
        subtotal: Number(pricing.subtotal),
        tax: Number(pricing.tax || 0),
        discount: Number(pricing.discount || 0),
        total: Number(pricing.total),
        taxRate: pricing.taxRate || 12, // Default 12% VAT
      },

      // Terms
      terms: {
        paymentTerms: terms.paymentTerms || "Net 30",
        validityDays: terms.validityDays || 30,
        notes: terms.notes || "",
      },
    };

    // Add template-specific fields from rest of proposalData
    // These fields (wasteAllowance, excessRate, equipment, etc.) come from template-specific forms
    Object.keys(rest).forEach((key) => {
      if (rest[key] !== undefined && rest[key] !== null) {
        baseData[key] = rest[key];
      }
    });

    return baseData;
  }

  /**
   * Format date to readable string
   * @param {Date} date - Date object
   * @returns {string} Formatted date
   */
  formatDate(date) {
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Create timeout promise
   * @param {number} ms - Milliseconds
   * @param {string} message - Timeout message
   * @returns {Promise} Timeout promise
   */
  timeout(ms, message) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    );
  }

  /**
   * Generate PDF from rendered HTML (without Handlebars processing)
   * Used for template preview when HTML is already rendered
   * @param {string} html - Fully rendered HTML
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDFFromHTML(html) {
    return this._generatePdf(html);
  }

  /**
   * Generate PDF from contract template and data
   * @param {Object} contractData - Contract data
   * @param {string} templateHtml - HTML template with Handlebars placeholders
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateContractPDF(contractData, templateHtml) {
    const templateData = this.prepareContractTemplateData(contractData);
    const html = Handlebars.compile(templateHtml)(templateData);
    return this._generatePdf(html);
  }

  /**
   * Render contract template to HTML string (without generating PDF).
   * Reuses the same data preparation and Handlebars compilation as generateContractPDF.
   * @param {Object} contractData - Contract data
   * @param {string} templateHtml - HTML template with Handlebars placeholders
   * @returns {string} Rendered HTML string
   */
  renderContractTemplate(contractData, templateHtml) {
    const templateData = this.prepareContractTemplateData(contractData);
    const template = Handlebars.compile(templateHtml);
    return template(templateData);
  }

  /**
   * Render proposal template to HTML string (without generating PDF).
   * The data object is already shaped to match template placeholders directly
   * (clientName, services[], pricing{}, terms{}, etc.) — no field mapping needed.
   * @param {Object} data - Template data already keyed to match {{placeholders}}
   * @param {string} templateHtml - HTML template with Handlebars placeholders
   * @returns {string} Rendered HTML string
   */
  renderProposalTemplate(data, templateHtml) {
    const template = Handlebars.compile(templateHtml);
    return template(data);
  }

  /**
   * Generate PDF from pre-rendered HTML (for edited contracts)
   * @param {string} html - Pre-rendered HTML content
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateContractFromHTML(html) {
    return this._generatePdf(html);
  }

  /**
   * Prepare contract data for template rendering
   * @param {Object} contractData - Raw contract data
   * @returns {Object} Template data
   */
  prepareContractTemplateData(contractData) {
    // Parse signatories if it's a JSON string
    let signatories = [];
    if (contractData.signatories) {
      try {
        signatories =
          typeof contractData.signatories === "string"
            ? JSON.parse(contractData.signatories)
            : contractData.signatories;
      } catch (error) {
        console.error("Failed to parse signatories:", error);
        signatories = [];
      }
    }

    // Format contract date
    const contractDate = new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return {
      // Contract identification
      contractNumber: contractData.contractNumber || "PENDING",
      contractDate,

      // Client information
      clientName: contractData.clientName || "",
      companyName: contractData.companyName || "",
      clientEmail: contractData.clientEmailContract || contractData.clientEmail || "",
      clientAddress: contractData.clientAddress || "",

      // Service details
      contractType: this.formatContractType(contractData.contractType),
      contractDuration: contractData.contractDuration || "",
      serviceLatitude: contractData.serviceLatitude || "",
      serviceLongitude: contractData.serviceLongitude || "",

      // Collection details
      collectionSchedule: this.formatCollectionSchedule(contractData.collectionSchedule),
      collectionScheduleOther: contractData.collectionScheduleOther || "",
      wasteAllowance: contractData.wasteAllowance || "",

      // Pricing
      ratePerKg: contractData.ratePerKg || "",

      // Terms
      specialClauses: contractData.specialClauses || "",
      clientRequests: contractData.clientRequests || "",

      // Signatories
      signatories,

      // Company info
      companyLogoUrl: process.env.COMPANY_LOGO_URL || "",
    };
  }

  /**
   * Format contract type for display
   * @param {string} type - Contract type
   * @returns {string} Formatted type
   */
  formatContractType(type) {
    const types = {
      long_term_variable: "Long Term Garbage Variable Charge",
      long_term_fixed: "Long Term Garbage Fixed Charge (Over 50,000 PHP/month)",
      fixed_rate_term: "Fixed Rate Term",
      garbage_bins: "Garbage Bins Rental",
      garbage_bins_disposal: "Garbage Bins with Disposal Service",
    };
    return types[type] || type || "";
  }

  /**
   * Format collection schedule for display
   * @param {string} schedule - Collection schedule
   * @returns {string} Formatted schedule
   */
  formatCollectionSchedule(schedule) {
    const schedules = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      bi_weekly: "Bi-Weekly",
      other: "Other",
    };
    return schedules[schedule] || schedule || "";
  }

}

export default new PDFService();
