/**
 * Form Validation Utilities
 * Contains reusable validation functions for form fields
 */

/**
 * Validates Philippine and international phone numbers
 * @param {string} phone - Phone number to validate
 * @returns {string|null} Error message or null if valid
 */
export const validatePhone = (phone) => {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, "");

  if (!phone.trim()) {
    return "Phone number is required";
  }

  // Philippine mobile: +63 9XX XXX XXXX or 09XX XXX XXXX
  // Philippine landline: (0XX) XXX XXXX
  // International: 10-15 digits

  // Check if starts with +63 (Philippine country code)
  if (phone.startsWith("+63")) {
    if (digitsOnly.length !== 12) {
      // +63 + 10 digits
      return "Philippine mobile number should be +63 9XX XXX XXXX";
    }
    if (!digitsOnly.startsWith("639")) {
      return "Philippine mobile number should start with +63 9";
    }
  }
  // Check if starts with 09 (Philippine mobile format)
  else if (phone.startsWith("09")) {
    if (digitsOnly.length !== 11) {
      return "Philippine mobile number should be 09XX XXX XXXX (11 digits)";
    }
  }
  // Check if it's a landline format starting with 0
  else if (phone.startsWith("0") && !phone.startsWith("09")) {
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      return "Landline number should be 10-11 digits";
    }
  }
  // International format without +
  else if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    // Allow international numbers (10-15 digits)
    return null;
  } else {
    return "Please enter a valid phone number";
  }

  return null; // No error
};

/**
 * Validates email address format
 * @param {string} email - Email address to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateEmail = (email) => {
  if (!email.trim()) {
    return "Email is required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }

  return null;
};

/**
 * Validates company/site name
 * @param {string} company - Company name to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateCompany = (company) => {
  if (!company.trim()) {
    return "Company/Site name is required";
  }

  if (company.trim().length < 2) {
    return "Company name must be at least 2 characters";
  }

  return null;
};

/**
 * Validates required text field
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {string|null} Error message or null if valid
 */
export const validateRequired = (value, fieldName = "This field") => {
  if (!value.trim()) {
    return `${fieldName} is required`;
  }

  return null;
};

/**
 * Formats phone number to Philippine format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  const digitsOnly = phone.replace(/\D/g, "");

  // Format Philippine mobile: 09XX XXX XXXX
  if (digitsOnly.startsWith("09") && digitsOnly.length === 11) {
    return digitsOnly.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
  }

  // Format Philippine mobile with country code: +63 9XX XXX XXXX
  if (digitsOnly.startsWith("639") && digitsOnly.length === 12) {
    return digitsOnly.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, "+$1 $2 $3 $4");
  }

  // Return as-is if no formatting rule matches
  return phone;
};

/**
 * Validates all form fields at once
 * @param {Object} formData - Form data object
 * @param {Object} fieldValidators - Object mapping field names to validator functions
 * @returns {Object} Object with field names as keys and error messages as values
 */
export const validateForm = (formData, fieldValidators) => {
  const errors = {};

  Object.keys(fieldValidators).forEach((field) => {
    const validator = fieldValidators[field];
    const error = validator(formData[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};
