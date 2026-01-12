import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import { AppError } from "../middleware/errorHandler.js";

/**
 * PDFService - Handle PDF generation from HTML templates
 */
class PDFService {
  constructor() {
    this.registerHandlebarsHelpers();
  }

  /**
   * Generate PDF from proposal data and template
   * @param {Object} proposalData - Proposal data (services, pricing, terms)
   * @param {Object} inquiryData - Inquiry data for client info
   * @param {string} templateHtml - HTML template with Handlebars placeholders
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateProposalPDF(proposalData, inquiryData, templateHtml) {
    let browser;

    try {
      // Prepare data for template
      const templateData = this.prepareTemplateData(
        proposalData,
        inquiryData
      );

      // Compile and render template
      const template = Handlebars.compile(templateHtml);
      const html = template(templateData);

      // Launch browser with timeout
      const launchPromise = puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      browser = await Promise.race([
        launchPromise,
        this.timeout(10000, "Browser launch timeout"),
      ]);

      const page = await browser.newPage();

      // Set content with timeout
      await Promise.race([
        page.setContent(html, { waitUntil: "networkidle0" }),
        this.timeout(15000, "Page load timeout"),
      ]);

      // Generate PDF with timeout (30 seconds total)
      const pdfBuffer = await Promise.race([
        page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "20px",
            bottom: "20px",
            left: "20px",
            right: "20px",
          },
        }),
        this.timeout(30000, "PDF generation timeout"),
      ]);

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      throw new AppError(
        `PDF generation failed: ${error.message}`,
        500
      );
    }
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
   * Register custom Handlebars helpers
   */
  registerHandlebarsHelpers() {
    // Helper for formatting currency
    Handlebars.registerHelper("currency", function (value) {
      return `₱${Number(value).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    });

    // Helper for formatting dates
    Handlebars.registerHelper("formatDate", function (date) {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-PH");
    });

    // Helper for conditional display
    Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    // Helper for greater than comparison
    Handlebars.registerHelper("ifGreaterThan", function (arg1, arg2, options) {
      return arg1 > arg2 ? options.fn(this) : options.inverse(this);
    });

    // Helper for mathematical operations
    Handlebars.registerHelper("multiply", function (a, b) {
      return Number(a) * Number(b);
    });

    // Helper for addition
    Handlebars.registerHelper("add", function (a, b) {
      return Number(a) + Number(b);
    });

    // Helper for subtraction
    Handlebars.registerHelper("subtract", function (a, b) {
      return Number(a) - Number(b);
    });
  }
}

export default new PDFService();
