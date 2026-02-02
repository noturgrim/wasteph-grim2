import {
  createTicketSchema,
  updateTicketStatusSchema,
  addTicketCommentSchema,
  getTicketsQuerySchema,
} from "../validation/ticketSchema.js";
import { AppError } from "./errorHandler.js";

/**
 * Middleware: Validate create ticket request
 */
export const validateCreateTicket = (req, res, next) => {
  try {
    const validatedData = createTicketSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error.name === "ZodError") {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    next(error);
  }
};

/**
 * Middleware: Validate update ticket status request
 */
export const validateUpdateTicketStatus = (req, res, next) => {
  try {
    const validatedData = updateTicketStatusSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error.name === "ZodError") {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    next(error);
  }
};

/**
 * Middleware: Validate add ticket comment request
 */
export const validateAddTicketComment = (req, res, next) => {
  try {
    const validatedData = addTicketCommentSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error.name === "ZodError") {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    next(error);
  }
};

/**
 * Middleware: Validate get tickets query params
 */
export const validateGetTicketsQuery = (req, res, next) => {
  try {
    const validatedData = getTicketsQuerySchema.parse(req.query);
    req.query = validatedData;
    next();
  } catch (error) {
    if (error.name === "ZodError") {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    next(error);
  }
};
