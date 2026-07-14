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

router.post('/login', validateLogin, checkValidation, login);
router.post('/register', validateRegister, checkValidation, register);
export default router;