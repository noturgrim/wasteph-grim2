import DOMPurify from "dompurify";

/**
 * Sanitize HTML to prevent XSS attacks.
 * Uses DOMPurify with sensible defaults for rich content.
 *
 * @param {string} dirty - Untrusted HTML string
 * @param {object} [options] - DOMPurify configuration overrides
 * @returns {string} Sanitized HTML safe for rendering
 */
export const sanitizeHtml = (dirty, options = {}) => {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, options);
};

/**
 * Sanitize HTML while preserving <style> tags.
 * Use for template previews / contract previews that include embedded CSS.
 */
export const sanitizeHtmlWithStyles = (dirty) => {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ["style"],
    ADD_ATTR: ["class", "style", "target", "rel"],
  });
};

/**
 * Sanitize CSS content for use inside <style> tags.
 * Strips expressions, url(javascript:), and other dangerous patterns.
 */
export const sanitizeCss = (css) => {
  if (!css) return "";
  return css
    .replace(/expression\s*\(/gi, "")
    .replace(/url\s*\(\s*['"]?\s*javascript:/gi, "url(")
    .replace(/@import\s+url/gi, "/* blocked import */")
    .replace(/behavior\s*:/gi, "/* blocked */:");
};
