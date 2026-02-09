import { z } from "zod";
import { sanitizeString } from "../utils/sanitize.js";

/**
 * Validation schemas for Client Tickets
 * Uses Zod for runtime type checking and validation with sanitization
 */

// Ticket category enum values
const ticketCategories = [
  "technical_issue",
  "billing_payment",
  "feature_request",
  "complaint",
  "feedback",
  "contract_legal",
  "other",
];

// Ticket priority enum values
const ticketPriorities = ["low", "medium", "high", "urgent"];

// Ticket status enum values
const ticketStatuses = ["open", "in_progress", "resolved", "closed"];

// Create Ticket Schema
export const createTicketSchema = z.object({
  clientId: z
    .string({
      required_error: "Client ID is required",
      invalid_type_error: "Client ID must be a string",
    })
    .uuid("Invalid client ID format"),

  contractId: z
    .string()
    .uuid("Invalid contract ID format")
    .nullish(),

  category: z.enum(ticketCategories, {
    required_error: "Ticket category is required",
    invalid_type_error: "Invalid ticket category",
  }),

  priority: z
    .enum(ticketPriorities, {
      invalid_type_error: "Invalid ticket priority",
    })
    .default("medium"),

  subject: z
    .string({
      required_error: "Subject is required",
      invalid_type_error: "Subject must be a string",
    })
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be less than 200 characters")
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
});

// Update Ticket Schema (subject, description, category, priority, clientId)
export const updateTicketSchema = z
  .object({
    clientId: z.string().uuid("Invalid client ID format").optional(),

    contractId: z.string().uuid("Invalid contract ID format").nullish(),

    category: z
      .enum(ticketCategories, {
        invalid_type_error: "Invalid ticket category",
      })
      .optional(),

    priority: z
      .enum(ticketPriorities, {
        invalid_type_error: "Invalid ticket priority",
      })
      .optional(),

    subject: z
      .string({
        invalid_type_error: "Subject must be a string",
      })
      .trim()
      .min(3, "Subject must be at least 3 characters")
      .max(200, "Subject must be less than 200 characters")
      .transform((val) => sanitizeString(val))
      .optional(),

    description: z
      .string({
        invalid_type_error: "Description must be a string",
      })
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(5000, "Description must be less than 5000 characters")
      .transform((val) => sanitizeString(val))
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Update Ticket Status Schema
export const updateTicketStatusSchema = z.object({
  status: z.enum(ticketStatuses, {
    required_error: "Status is required",
    invalid_type_error: "Invalid ticket status",
  }),

  resolutionNotes: z
    .string()
    .trim()
    .max(5000, "Resolution notes must be less than 5000 characters")
    .transform((val) => sanitizeString(val))
    .optional(),
});

// Add Ticket Comment Schema
export const addTicketCommentSchema = z.object({
  content: z
    .string({
      required_error: "Comment content is required",
      invalid_type_error: "Comment content must be a string",
    })
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be less than 2000 characters")
    .transform((val) => sanitizeString(val)),
});

// Get Tickets Query Schema
export const getTicketsQuerySchema = z.object({
  clientId: z.string().uuid("Invalid client ID format").optional(),
  // Accept single value or comma-separated string for filters
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      // Split comma-separated values and validate each
      const values = val.split(",").map((v) => v.trim());
      values.forEach((v) => {
        if (!ticketStatuses.includes(v)) {
          throw new Error(`Invalid status value: ${v}`);
        }
      });
      return val; // Return original comma-separated string for service layer
    }),
  category: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      // Split comma-separated values and validate each
      const values = val.split(",").map((v) => v.trim());
      values.forEach((v) => {
        if (!ticketCategories.includes(v)) {
          throw new Error(`Invalid category value: ${v}`);
        }
      });
      return val; // Return original comma-separated string for service layer
    }),
  priority: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      // Split comma-separated values and validate each
      const values = val.split(",").map((v) => v.trim());
      values.forEach((v) => {
        if (!ticketPriorities.includes(v)) {
          throw new Error(`Invalid priority value: ${v}`);
        }
      });
      return val; // Return original comma-separated string for service layer
    }),
  createdBy: z.string().optional(),
});
