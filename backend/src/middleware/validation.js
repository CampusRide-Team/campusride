import { check, validationResult } from "express-validator";

export const validateRegister = [
  check("fullName", "Full name is required").notEmpty().trim(),

  check("email", "Please include a valid email address")
    .isEmail()
    .normalizeEmail(),

  // 💡 FIXED: Advanced regex supporting local format (054...) and international format (23354...)
  check("phoneNumber", "Valid Ghana phone number required")
    .trim()
    .custom((value) => {
      // Strips any leftover leading plus signs or white spaces dynamically
      const cleanPhone = value.replace(/^\+/, "").trim();
      const ghanaPhoneRegex = /^(02|05)[0-9]{8}$|^(233)(2|5)[0-9]{8}$/;
      
      if (!ghanaPhoneRegex.test(cleanPhone)) {
        throw new Error("Phone number must be a valid Ghana format (e.g., 054... or 23354...)");
      }
      return true;
    }),

  check(
    "password",
    "Password must be 8+ chars, 1 uppercase, 1 number, 1 special",
  ).isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }),
  check("role", "Invalid role").optional().isIn(["student", "driver", "admin"]),
];

export const validateLogin = [
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").exists(),
];

export const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Invalid input data provided.",
        details: errors
          .array()
          .map((err) => ({ field: err.path, issue: err.msg })),
      },
    });
  }
  next();
};