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
  status: z.enum(ticketStatuses).optional(),
  category: z.enum(ticketCategories).optional(),
  priority: z.enum(ticketPriorities).optional(),
  createdBy: z.string().optional(),
});
