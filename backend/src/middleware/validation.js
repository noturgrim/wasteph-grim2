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
  body("location").optional().trim(),
  body("message").optional().trim(),
  body("source")
    .optional()
    .isIn(["website", "facebook", "email", "phone", "walk-in", "cold-approach", "referral"])
    .withMessage("Invalid source value"),
  body("isInformationComplete").optional().isBoolean().withMessage("isInformationComplete must be a boolean"),
];

// Lead validation
export const leadValidation = [
  body("clientName").optional().trim(),
  body("company").optional().trim(),
  body("email")
    .optional({ values: "falsy" })
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone").optional({ values: "falsy" }).trim(),
  body("location").optional({ values: "falsy" }).trim(),
  body("notes").optional({ values: "falsy" }).trim(),
  // Custom validation: either clientName or company must be provided
  body().custom((value, { req }) => {
    if (!req.body.clientName?.trim() && !req.body.company?.trim()) {
      throw new Error("Either client name or company is required");
    }
    return true;
  }),
];

// Public lead validation (from landing page)
export const publicLeadValidation = [
  body("company")
    .trim()
    .notEmpty()
    .withMessage("Company/Site name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("Company name must be between 2 and 255 characters")
    .escape() // Sanitize HTML/script tags
    .matches(/^[a-zA-Z0-9\s\-\.\,\&\(\)]+$/)
    .withMessage("Company name contains invalid characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address")
    .isLength({ max: 100 })
    .withMessage("Email must not exceed 100 characters"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isLength({ min: 10, max: 20 })
    .withMessage("Phone number must be between 10 and 20 characters")
    .matches(/^[\d\s\+\-\(\)]+$/)
    .withMessage("Phone number can only contain digits, spaces, and +()-"),
  body("wasteType")
    .optional({ values: "falsy" }) // Make optional
    .trim()
    .isLength({ max: 500 })
    .withMessage("Waste type must not exceed 500 characters")
    .escape(), // Sanitize HTML/script tags
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ max: 500 })
    .withMessage("Location must not exceed 500 characters")
    .escape(), // Sanitize HTML/script tags
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
