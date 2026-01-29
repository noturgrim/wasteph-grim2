import { z } from "zod";
import { AppError } from "./errorHandler.js";

/**
 * Validation Middleware for Contract endpoints
 * Uses Zod for schema validation
 */

// Signatory schema
const signatorySchema = z.object({
  name: z.string().min(1, "Signatory name is required"),
  position: z.string().min(1, "Signatory position is required"),
});

// Contract request schema
const requestContractSchema = z.object({
  // All fields are now required
  contractType: z.enum(
    ["long_term_variable", "long_term_fixed", "fixed_rate_term", "garbage_bins", "garbage_bins_disposal"],
    { errorMap: () => ({ message: "Invalid contract type" }) }
  ),
  clientName: z.string().min(1, "Client name is required"),
  companyName: z.string().min(1, "Company name is required"),
  clientEmailContract: z.string().email("Invalid email format").min(1, "Client email is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  contractDuration: z.string().min(1, "Contract duration is required"),
  serviceLatitude: z.string().min(1, "Service latitude is required"),
  serviceLongitude: z.string().min(1, "Service longitude is required"),
  collectionSchedule: z.enum(
    ["daily", "weekly", "monthly", "bi_weekly", "other"],
    { errorMap: () => ({ message: "Invalid collection schedule" }) }
  ),
  collectionScheduleOther: z.string().optional(), // Required if collectionSchedule is "other"
  wasteAllowance: z.string().min(1, "Waste allowance is required"),
  specialClauses: z.string().min(1, "Special clauses are required"),
  signatories: z
    .array(signatorySchema)
    .min(1, "At least one signatory is required"),
  ratePerKg: z.string().min(1, "Rate per kg specification is required"),
  clientRequests: z.string().min(1, "Client requests are required"),
  requestNotes: z.string().min(1, "Request notes are required"),
});

/**
 * Validate request contract
 */
export const validateRequestContract = (req, res, next) => {
  try {
    requestContractSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return next(new AppError(`Validation error: ${errorMessages}`, 400));
    }
    next(error);
  }
};
