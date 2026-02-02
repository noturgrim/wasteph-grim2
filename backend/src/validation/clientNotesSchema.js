import { z } from "zod";
import { sanitizeString } from "../utils/sanitize.js";

/**
 * Validation schemas for Client Notes
 * Uses Zod for runtime type checking and validation with sanitization
 */

// Client interaction type enum values
const interactionTypes = [
  "phone_call",
  "site_visit",
  "email",
  "meeting",
  "other",
];

// Create Client Note Schema
export const createClientNoteSchema = z.object({
  clientId: z
    .string({
      required_error: "Client ID is required",
      invalid_type_error: "Client ID must be a string",
    })
    .uuid("Invalid client ID format"),

  interactionType: z.enum(interactionTypes, {
    required_error: "Interaction type is required",
    invalid_type_error: "Invalid interaction type",
  }),

  subject: z
    .string({
      required_error: "Subject is required",
      invalid_type_error: "Subject must be a string",
    })
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be less than 200 characters")
    .transform((val) => sanitizeString(val)),

  content: z
    .string({
      required_error: "Content is required",
      invalid_type_error: "Content must be a string",
    })
    .trim()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content must be less than 5000 characters")
    .transform((val) => sanitizeString(val)),

  interactionDate: z
    .string({
      required_error: "Interaction date is required",
      invalid_type_error: "Interaction date must be a string",
    })
    .datetime("Invalid date format (ISO 8601 required)"),
});

// Update Client Note Schema
export const updateClientNoteSchema = z.object({
  interactionType: z
    .enum(interactionTypes, {
      invalid_type_error: "Invalid interaction type",
    })
    .optional(),

  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be less than 200 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  content: z
    .string()
    .trim()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content must be less than 5000 characters")
    .transform((val) => sanitizeString(val))
    .optional(),

  interactionDate: z
    .string()
    .datetime("Invalid date format (ISO 8601 required)")
    .optional(),
});

// Get Client Notes Query Schema
export const getClientNotesQuerySchema = z.object({
  clientId: z.string().uuid("Invalid client ID format").optional(),
  interactionType: z.enum(interactionTypes).optional(),
  startDate: z
    .string()
    .datetime("Invalid start date format (ISO 8601 required)")
    .optional(),
  endDate: z
    .string()
    .datetime("Invalid end date format (ISO 8601 required)")
    .optional(),
});
