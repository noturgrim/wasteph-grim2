import { body, validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Auth validation rules
export const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
];

// Inquiry validation
export const inquiryValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone").optional().trim(),
  body("company").optional().trim(),
  body("message").trim().notEmpty().withMessage("Message is required"),
  body("source")
    .optional()
    .isIn(["website", "facebook", "email", "phone", "walk-in", "cold-approach"])
    .withMessage("Invalid source value"),
];

// Lead validation
export const leadValidation = [
  body("clientName").trim().notEmpty().withMessage("Client name is required"),
  body("company").optional().trim(),
  body("email").optional().isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("phone").optional().trim(),
  body("location").optional().trim(),
  body("notes").optional().trim(),
];

// Client validation
export const clientValidation = [
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("contactPerson")
    .trim()
    .notEmpty()
    .withMessage("Contact person is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("province").trim().notEmpty().withMessage("Province is required"),
];
