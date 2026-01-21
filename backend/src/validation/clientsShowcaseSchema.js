import { z } from "zod";
import { sanitizeString, sanitizeArray } from "../utils/sanitize.js";

/**
 * Validation schemas for Clients Showcase
 * Uses Zod for runtime type checking and validation with sanitization
 */

// URL validation helper
const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(500, "URL must be less than 500 characters")
  .optional()
  .or(z.literal(""));

// Create Client Showcase Schema
export const createClientShowcaseSchema = z.object({
  // Required fields
  company: z
    .string({
      required_error: "Company name is required",
      invalid_type_error: "Company name must be a string",
    })
    .trim()
    .min(1, "Company name cannot be empty")
    .max(200, "Company name must be less than 200 characters")
    .transform((val) => sanitizeString(val)),

  industry: z
    .string({
      required_error: "Industry is required",
      invalid_type_error: "Industry must be a string",
    })
    .trim()
    .min(1, "Industry cannot be empty")
    .max(100, "Industry must be less than 100 characters")
    .transform((val) => sanitizeString(val)),

  background: z
    .string({
      required_error: "Background is required",
      invalid_type_error: "Background must be a string",
    })
    .trim()
    .min(10, "Background must be at least 10 characters")
    .max(2000, "Background must be less than 2000 characters")
    .transform((val) => sanitizeString(val)),

  testimonial: z
    .string({
      required_error: "Testimonial is required",
      invalid_type_error: "Testimonial must be a string",
    })
    .trim()
    .min(10, "Testimonial must be at least 10 characters")
    .max(1000, "Testimonial must be less than 1000 characters")
    .transform((val) => sanitizeString(val)),

  author: z
    .string({
      required_error: "Author name is required",
      invalid_type_error: "Author name must be a string",
    })
    .trim()
    .min(1, "Author name cannot be empty")
    .max(100, "Author name must be less than 100 characters")
    .transform((val) => sanitizeString(val)),

  // Optional fields
  logo: urlSchema,

  location: z
    .string()
    .trim()
    .max(100, "Location must be less than 100 characters")
    .transform((val) => sanitizeString(val))
    .optional()
    .or(z.literal("")),

  employees: z
    .string()
    .trim()
    .max(50, "Employees must be less than 50 characters")
    .transform((val) => sanitizeString(val))
    .optional()
    .or(z.literal("")),

  established: z
    .string()
    .trim()
    .max(50, "Established must be less than 50 characters")
    .transform((val) => sanitizeString(val))
    .optional()
    .or(z.literal("")),

  challenge: z
    .string()
    .trim()
    .max(1000, "Challenge must be less than 1000 characters")
    .transform((val) => sanitizeString(val))
    .optional()
    .or(z.literal("")),

  solution: z
    .string()
    .trim()
    .max(1000, "Solution must be less than 1000 characters")
    .transform((val) => sanitizeString(val))
    .optional()
    .or(z.literal("")),

  position: z
    .string()
    .trim()
    .max(100, "Position must be less than 100 characters")
    .transform((val) => sanitizeString(val))
    .optional()
    .or(z.literal("")),

  rating: z
    .number({
      invalid_type_error: "Rating must be a number",
    })
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .optional()
    .or(z.literal(null)),

  wasteReduction: z
    .string()
    .trim()
    .max(100, "Waste reduction must be less than 100 characters")
    .transform((val) => sanitizeString(val))
    .optional()
    .or(z.literal("")),

  partnership: z
    .string()
    .trim()
    .max(100, "Partnership must be less than 100 characters")
    .transform((val) => sanitizeString(val))
    .optional()
    .or(z.literal("")),

  achievements: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Achievement cannot be empty")
        .max(200, "Each achievement must be less than 200 characters")
        .transform((val) => sanitizeString(val))
    )
    .max(20, "Maximum 20 achievements allowed")
    .optional()
    .default([]),

  isActive: z
    .boolean({
      invalid_type_error: "isActive must be a boolean",
    })
    .optional()
    .default(true),
});

// Update Client Showcase Schema (all fields optional except those being updated)
export const updateClientShowcaseSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Company name cannot be empty")
    .max(200, "Company name must be less than 200 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  industry: z
    .string()
    .trim()
    .min(1, "Industry cannot be empty")
    .max(100, "Industry must be less than 100 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  background: z
    .string()
    .trim()
    .min(10, "Background must be at least 10 characters")
    .max(2000, "Background must be less than 2000 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  testimonial: z
    .string()
    .trim()
    .min(10, "Testimonial must be at least 10 characters")
    .max(1000, "Testimonial must be less than 1000 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  author: z
    .string()
    .trim()
    .min(1, "Author name cannot be empty")
    .max(100, "Author name must be less than 100 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  logo: urlSchema,

  location: z
    .string()
    .trim()
    .max(100, "Location must be less than 100 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  employees: z
    .string()
    .trim()
    .max(50, "Employees must be less than 50 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  established: z
    .string()
    .trim()
    .max(50, "Established must be less than 50 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  challenge: z
    .string()
    .trim()
    .max(1000, "Challenge must be less than 1000 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  solution: z
    .string()
    .trim()
    .max(1000, "Solution must be less than 1000 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  position: z
    .string()
    .trim()
    .max(100, "Position must be less than 100 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .optional()
    .or(z.literal(null)),

  wasteReduction: z
    .string()
    .trim()
    .max(100, "Waste reduction must be less than 100 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  partnership: z
    .string()
    .trim()
    .max(100, "Partnership must be less than 100 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  achievements: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Achievement cannot be empty")
        .max(200, "Each achievement must be less than 200 characters")
        .transform((val) => sanitizeString(val))
    )
    .max(20, "Maximum 20 achievements allowed")
    .optional(),

  isActive: z.boolean().optional(),
});
