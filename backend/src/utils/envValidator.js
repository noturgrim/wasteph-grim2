/**
 * Environment Variable Validator
 * Ensures critical environment variables are set in production
 */

const isProduction = process.env.NODE_ENV === "production";

/**
 * Validates that a required environment variable is set
 * @param {string} key - Environment variable name
 * @param {*} fallback - Fallback value for development
 * @returns {*} The environment variable value or fallback
 * @throws {Error} In production if the variable is not set
 */
export const requireEnv = (key, fallback = null) => {
  const value = process.env[key];

  if (!value) {
    if (isProduction) {
      throw new Error(
        `[FATAL] Required environment variable ${key} is not set. ` +
          `Application cannot start in production without this variable.`,
      );
    }

    if (fallback !== null) {
      console.warn(
        `[DEV] Environment variable ${key} not set, using fallback: ${fallback}`,
      );
      return fallback;
    }

    throw new Error(
      `[FATAL] Required environment variable ${key} is not set and no fallback provided.`,
    );
  }

  return value;
};

/**
 * Validates multiple required environment variables at once
 * @param {string[]} keys - Array of environment variable names
 * @throws {Error} In production if any variable is not set
 */
export const requireEnvVars = (keys) => {
  const missing = keys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    if (isProduction) {
      throw new Error(
        `[FATAL] Required environment variables not set: ${missing.join(", ")}. ` +
          `Application cannot start in production without these variables.`,
      );
    }

    console.warn(`[DEV] Missing environment variables: ${missing.join(", ")}`);
  }
};

/**
 * Validates all critical environment variables for the application
 * Should be called at application startup
 */
export const validateCriticalEnv = () => {
  console.log("Validating environment variables...");

  const critical = [
    "DATABASE_URL",
    "FRONTEND_URL",
    "CSRF_SECRET",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASSWORD",
  ];

  const recommended = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME",
    "COMPANY_LOGO_URL",
  ];

  // Check critical variables
  const missingCritical = critical.filter((key) => !process.env[key]);
  const missingRecommended = recommended.filter((key) => !process.env[key]);

  if (missingCritical.length > 0) {
    const message = `Required environment variables not set: ${missingCritical.join(", ")}`;

    if (isProduction) {
      console.error(`\n[FATAL] ${message}`);
      throw new Error(message);
    } else {
      console.warn(`\n[DEV] ${message}`);
    }
  }

  if (missingRecommended.length > 0 && isProduction) {
    console.warn(
      `\n[PROD] Recommended environment variables not set: ${missingRecommended.join(", ")}`,
    );
  }

  if (missingCritical.length === 0 && missingRecommended.length === 0) {
    console.log("All environment variables validated");
  } else if (missingCritical.length === 0) {
    console.log("Critical environment variables validated");
  }
};

/**
 * Get environment variable with fallback (non-critical)
 * @param {string} key - Environment variable name
 * @param {*} fallback - Fallback value
 * @returns {*} The environment variable value or fallback
 */
export const getEnv = (key, fallback) => {
  return process.env[key] || fallback;
};
