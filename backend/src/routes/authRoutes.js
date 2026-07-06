import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login } from '../controllers/authController.js';
import { validateRegister, validateLogin, checkValidation } from '../middleware/validation.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Please try again in 15 minutes.' } }
});

router.post('/register', authLimiter, validateRegister, checkValidation, register);
router.post('/login', authLimiter, validateLogin, checkValidation, login);

export default router;