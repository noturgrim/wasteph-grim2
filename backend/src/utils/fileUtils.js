import crypto from "crypto";

/**
 * Magic bytes signatures for common file types.
 * Each entry maps a MIME type to an array of possible signatures:
 *   { offset, bytes } — the expected bytes at the given offset.
 */
const MAGIC_SIGNATURES = {
  // Images
  "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/jpg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],
  "image/gif": [
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  "image/webp": [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header (WebP is RIFF-based)
  ],
  // Documents
  "application/pdf": [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  "application/msword": [
    { offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE2 compound document
  ],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK (ZIP-based)
  ],
  "application/vnd.ms-excel": [
    { offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE2 compound document
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK (ZIP-based)
  ],
};

/**
 * Validate a file buffer against its claimed MIME type using magic bytes.
 * SVG and text files are exempted since they are text-based and have no magic bytes.
 *
 * @param {Buffer} buffer - File contents
 * @param {string} claimedMime - The MIME type reported by the client
 * @returns {{ valid: boolean, message?: string }}
 */
export const validateMagicBytes = (buffer, claimedMime) => {
  if (!buffer || buffer.length === 0) {
    return { valid: false, message: "Empty file" };
  }

  // Text-based formats have no reliable magic bytes — skip validation
  const textBasedMimes = ["text/plain", "image/svg+xml"];
  if (textBasedMimes.includes(claimedMime)) {
    return { valid: true };
  }

  const signatures = MAGIC_SIGNATURES[claimedMime];

  // If we don't have a signature for this MIME type, allow it
  // (better to not block unknown types than to break features)
  if (!signatures) {
    return { valid: true };
  }

  // Check if the buffer matches ANY of the valid signatures
  const matches = signatures.some(({ offset, bytes }) => {
    if (buffer.length < offset + bytes.length) return false;
    return bytes.every((byte, i) => buffer[offset + i] === byte);
  });

  if (!matches) {
    return {
      valid: false,
      message: `File content does not match its claimed type (${claimedMime})`,
    };
  }

  return { valid: true };
};

/**
 * Express middleware that validates uploaded file magic bytes.
 * Place AFTER multer middleware in the route chain.
 * Works for both single and no-file uploads (skips if no file).
 */
export const validateFileSignature = (req, res, next) => {
  if (!req.file) return next();

  const result = validateMagicBytes(req.file.buffer, req.file.mimetype);
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      message: result.message || "Invalid file type",
    });
  }

  next();
};

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
