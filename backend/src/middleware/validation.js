import { check, validationResult } from 'express-validator';

export const validateRegister = [
  check('fullName', 'Full name is required').notEmpty(),
  check('email', 'Please include a valid UG email').matches(/[a-zA-Z0-9._%+-]+@(st\.ug\.edu\.gh|ug\.edu\.gh)$/),
  check('phoneNumber', 'Valid Ghana phone number required').matches(/^(05|02)[0-9]{8}$/),
  check('password', 'Password must be 8+ chars, 1 uppercase, 1 number, 1 special').isStrongPassword({
    minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1
  }),
  check('role', 'Invalid role').optional().isIn(['student', 'driver'])
];

export const validateLogin = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

export const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: { 
        code: 'VALIDATION_FAILED', 
        message: 'Invalid input data provided.', 
        details: errors.array().map(err => ({ field: err.path, issue: err.msg })) 
      }
    });
  }
  next();
};