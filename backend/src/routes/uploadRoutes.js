import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// @desc    Upload a document/image to Cloudinary
// @route   POST /api/v1/upload
router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
  }
  
  // Return the secure Cloudinary URL so the frontend can attach it to the Driver's profile
  res.json({
    success: true,
    data: {
      url: req.file.path,
      format: req.file.mimetype
    }
  });
});

export default router;