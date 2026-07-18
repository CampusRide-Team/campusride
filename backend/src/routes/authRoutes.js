import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import { register, login } from '../controllers/authController.js';
import { validateRegister, validateLogin, checkValidation } from '../middleware/validation.js';

const router = express.Router();

// CONFIGURE MULT-PART FILE STORAGE DISPATCHER
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure an 'uploads' directory exists at your backend root folder
  },
  filename: (req, file, cb) => {
    // Generates a unique secure naming string format: asset-timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Optional: Keep files under 5MB for optimized database delivery
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Please try again in 15 minutes.' } }
});

router.post('/login', validateLogin, checkValidation, login);

// 💡 THE PRODUCTION MULTIPART INTERCEPTOR FIX: 
// We place the multer fields parser BEFORE validation checks so req.body is fully populated
router.post(
  '/register', 
  upload.fields([
    { name: 'insuranceFile', maxCount: 1 },
    { name: 'licenseFile', maxCount: 1 },
    { name: 'registrationFile', maxCount: 1 },
    { name: 'ghanaCardFront', maxCount: 1 },
    { name: 'ghanaCardBack', maxCount: 1 }
  ]),
  validateRegister, 
  checkValidation, 
  register
);

export default router;