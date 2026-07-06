import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'campusride_documents',
    allowedFormats: ['jpg', 'png', 'jpeg', 'pdf'],
    transformation: [{ width: 1000, crop: 'limit' }] // Compress large photos
  }
});

export const upload = multer({ storage: storage });