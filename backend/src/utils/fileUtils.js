import crypto from "crypto";

/**
 * Sanitize a filename to prevent path traversal attacks.
 * Removes potentially dangerous characters and path traversal sequences.
 *
 * @param {string} filename - Original filename from user upload
 * @returns {string} Sanitized filename safe for use in S3 keys
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return "file";

  // Remove path traversal sequences (.., ./)
  let safe = filename.replace(/\.\./g, "");

  // Remove or replace dangerous characters, keeping only alphanumeric, dots, hyphens, underscores
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Remove leading dots (hidden files)
  safe = safe.replace(/^\.+/, "");

  // Ensure filename isn't empty after sanitization
  if (!safe || safe.length === 0) {
    safe = "file";
  }

  // Limit filename length (keep extension)
  const maxLength = 100;
  if (safe.length > maxLength) {
    const ext = safe.substring(safe.lastIndexOf("."));
    const name = safe.substring(0, maxLength - ext.length);
    safe = name + ext;
  }

  return safe;
};

/**
 * Generate a secure random filename with sanitized original name.
 * Uses UUID v4 for unpredictability (better than timestamps).
 *
 * @param {string} originalName - Original filename from user upload
 * @returns {string} Safe filename: "uuid-sanitized-original.ext"
 */
export const generateSafeFilename = (originalName) => {
  const sanitized = sanitizeFilename(originalName);
  const uuid = crypto.randomUUID();
  return `${uuid}-${sanitized}`;
};
