import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// THE PRODUCTION SOLVER: Determine configurations dynamically per file structure type
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    
    return {
      folder: 'campusride_documents',
      // Cloudinary treats PDF uploads as generic non-image "raw" resource assets
      resource_type: isPdf ? 'raw' : 'image', 
      format: isPdf ? 'pdf' : undefined, // Allow Cloudinary to auto-detect image formats natively
      
       transformation: isPdf ? undefined : [{ width: 1000, crop: 'limit', quality: 'auto' }]
    };
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Safe 10MB budget constraint allowance per asset
});