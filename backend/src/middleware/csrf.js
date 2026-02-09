import crypto from "crypto";
import { requireEnv } from "../utils/envValidator.js";

// Secret for HMAC-signing CSRF tokens
// MUST be set in .env for production to prevent token invalidation on restart
const CSRF_SECRET = requireEnv(
  "CSRF_SECRET",
  crypto.randomBytes(32).toString("hex")
);

/**
 * Generate a CSRF token tied to a specific session ID.
 * Deterministic: same session always produces the same token (no DB storage needed).
 */
export const generateCsrfToken = (sessionId) => {
  return crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(sessionId)
    .digest("hex");
};

/**
 * Verify a CSRF token matches the expected value for a session.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export const verifyCsrfToken = (token, sessionId) => {
  if (!token || !sessionId) return false;

  const expected = generateCsrfToken(sessionId);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, "utf-8"),
      Buffer.from(expected, "utf-8"),
    );
  } catch {
    return false;
  }
};

/** HTTP methods that do not change state (safe methods). */
export const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
