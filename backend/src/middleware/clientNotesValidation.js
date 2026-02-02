import {
  createClientNoteSchema,
  updateClientNoteSchema,
  getClientNotesQuerySchema,
} from "../validation/clientNotesSchema.js";
import { AppError } from "./errorHandler.js";

/**
 * Middleware: Validate create client note request
 */
export const validateCreateClientNote = (req, res, next) => {
  try {
    const validatedData = createClientNoteSchema.parse(req.body);
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
 * Middleware: Validate update client note request
 */
export const validateUpdateClientNote = (req, res, next) => {
  try {
    const validatedData = updateClientNoteSchema.parse(req.body);
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
 * Middleware: Validate get client notes query params
 */
export const validateGetClientNotesQuery = (req, res, next) => {
  try {
    const validatedData = getClientNotesQuerySchema.parse(req.query);
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
