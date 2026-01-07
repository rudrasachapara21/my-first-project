const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- 1. Existing Storages ---

const profilePhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'diamond-connect/profile-photos',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }]
  },
});

const listingImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'diamond-connect/listing-images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  },
});

// --- 🛑 FIXED: Explicitly handle PDFs for Chat Documents ---
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Check if the uploaded file is a PDF
    const isPdf = file.mimetype === 'application/pdf';

    if (isPdf) {
      // ✅ FIX: Force 'raw' for PDFs to prevent 401 Errors
      return {
        folder: 'diamond-connect/chat-documents',
        resource_type: 'raw', // Critical for PDFs
        use_filename: true,
        unique_filename: true
      };
    } else {
      // Treat everything else (images) as standard images
      return {
        folder: 'diamond-connect/chat-documents',
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
      };
    }
  },
});

// --- 2. UPDATED: COMPOSITE STORAGE WITH RAW PDF SUPPORT ---
const listingCompositeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    
    // Case A: Diamond Photos (Always Images)
    if (file.fieldname === 'listingImages') {
      return {
        folder: 'diamond-connect/listing-images',
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
      };
    }
    
    // Case B: Certificate (PDFs must be RAW)
    if (file.fieldname === 'certificateFile') {
      const isPdf = file.mimetype === 'application/pdf';
      
      if (isPdf) {
          // 🛑 RAW MODE: This prevents corruption
          return {
            folder: 'diamond-connect/certificates',
            resource_type: 'raw', 
            use_filename: true, 
            unique_filename: true
          };
      } else {
          // If it's an image (JPG/PNG), treat it normally
          return {
            folder: 'diamond-connect/certificates',
            resource_type: 'image',
            allowed_formats: ['jpg', 'png', 'jpeg']
          };
      }
    }
  },
});

// --- 3. Filters & Instances ---

// Filter for standard images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only image files.'), false);
  }
};

const uploadProfilePhoto = multer({ 
    storage: profilePhotoStorage, 
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

const uploadListingImages = multer({ 
    storage: listingImageStorage, 
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// Chat Documents (PDFs allowed)
const uploadDocument = multer({ 
    storage: documentStorage, 
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// Updated Composite Uploader
const uploadListingComposite = multer({
  storage: listingCompositeStorage,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

module.exports = {
  uploadProfilePhoto: uploadProfilePhoto.single('profilePhoto'),
  uploadListingImages: uploadListingImages.array('listingImages', 5),
  uploadDocument: uploadDocument.single('document'),
  uploadListingWithCert: uploadListingComposite.fields([
    { name: 'listingImages', maxCount: 5 }, 
    { name: 'certificateFile', maxCount: 1 }
  ])
};