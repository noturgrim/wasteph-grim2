import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by cleaning HTML content
 */

// Create DOMPurify instance with jsdom window
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Potentially dangerous HTML string
 * @returns {string} - Clean, safe HTML string
 */
export const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== "string") {
    return dirty;
  }

  // Configure DOMPurify to be strict
  const config = {
    ALLOWED_TAGS: [], // No HTML tags allowed - strips all HTML
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content, remove tags
  };

  return DOMPurify.sanitize(dirty, config);
};

/**
 * Sanitize a string by removing dangerous characters and scripts
 * More lenient than sanitizeHtml, but still safe
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== "string") {
    return input;
  }

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, "");

  return sanitized;
};

/**
 * Sanitize an array of strings
 * @param {Array<string>} arr - Array of strings
 * @returns {Array<string>} - Array of sanitized strings
 */
export const sanitizeArray = (arr) => {
  if (!Array.isArray(arr)) {
    return arr;
  }

  return arr.map((item) => {
    if (typeof item === "string") {
      return sanitizeString(item);
    }
    return item;
  });
};

/**
 * Sanitize client showcase data
 * @param {Object} data - Client showcase data object
 * @returns {Object} - Sanitized data object
 */
export const sanitizeClientShowcaseData = (data) => {
  const sanitized = { ...data };

  // Sanitize string fields that could contain HTML/scripts
  const stringFields = [
    "company",
    "industry",
    "location",
    "employees",
    "established",
    "background",
    "challenge",
    "solution",
    "testimonial",
    "author",
    "position",
    "wasteReduction",
    "partnership",
  ];

  stringFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeString(sanitized[field]);
    }
  });

  // Sanitize array field
  if (sanitized.achievements) {
    sanitized.achievements = sanitizeArray(sanitized.achievements);
  }

  // URL fields are already validated by Zod schema
  // But we can add extra sanitization for javascript: protocol
  if (sanitized.logo) {
    sanitized.logo = sanitized.logo.replace(/javascript:/gi, "");
  }

  return sanitized;
};
