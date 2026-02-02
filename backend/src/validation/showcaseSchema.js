import { z } from "zod";
import { sanitizeString } from "../utils/sanitize.js";

/**
 * Validation schemas for Showcase
 * Uses Zod for runtime type checking and validation with sanitization
 */

// URL validation helper
const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(2000, "URL must be less than 2000 characters")
  .optional()
  .or(z.literal(""));

// Create Showcase Schema
export const createShowcaseSchema = z.object({
  // Required fields
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    })
    .trim()
    .min(1, "Title cannot be empty")
    .max(200, "Title must be less than 200 characters")
    .transform((val) => sanitizeString(val)),

  description: z
    .string({
      required_error: "Description is required",
      invalid_type_error: "Description must be a string",
    })
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters")
    .transform((val) => sanitizeString(val)),

  // Optional fields
  tagline: z
    .string()
    .trim()
    .max(200, "Tagline must be less than 200 characters")
    .transform((val) => sanitizeString(val))
    .optional()
    .or(z.literal("")),

  image: urlSchema,

  link: urlSchema,

  displayOrder: z
    .number({
      invalid_type_error: "Display order must be a number",
    })
    .int("Display order must be an integer")
    .min(0, "Display order must be at least 0")
    .optional()
    .default(0),

  isActive: z
    .boolean({
      invalid_type_error: "isActive must be a boolean",
    })
    .optional()
    .default(true),
});

// Update Showcase Schema (all fields optional except those being updated)
export const updateShowcaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(200, "Title must be less than 200 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  tagline: z
    .string()
    .trim()
    .max(200, "Tagline must be less than 200 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  image: urlSchema,

  link: urlSchema,

  displayOrder: z
    .number()
    .int("Display order must be an integer")
    .min(0, "Display order must be at least 0")
    .optional(),

  isActive: z.boolean().optional(),
}); 





