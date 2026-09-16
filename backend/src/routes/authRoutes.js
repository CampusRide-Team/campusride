import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { register, login, verifyLoginOtp } from '../controllers/authController.js';

const router = express.Router();

//  Ensure uploads/ folder exists on server boot so Multer never crashes
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// CONFIGURE MULTI-PART FILE STORAGE DISPATCHER
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Allow up to 10MB per document image
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 15, 
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Please try again in 15 minutes.' } }
});

router.post('/login', login);
router.post('/login/verify-otp', verifyLoginOtp); // Added missing OTP verification route

 router.post(
  '/register', 
  upload.fields([
    { name: 'insuranceFile', maxCount: 1 },
    { name: 'licenseFile', maxCount: 1 },
    { name: 'registrationFile', maxCount: 1 },
    { name: 'ghanaCardFront', maxCount: 1 },
    { name: 'ghanaCardBack', maxCount: 1 }
  ]),
  register
);

export default router;