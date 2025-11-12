const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with the keys from your .env file (or Render env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage for PROFILE PHOTOS
const profilePhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'diamond-connect/profile-photos',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }]
  },
});

// Configure storage for LISTING IMAGES
const listingImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'diamond-connect/listing-images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  },
});

// ## --- NEW: Configure storage for CHAT DOCUMENTS --- ##
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'diamond-connect/chat-documents',
    // We set 'resource_type: "auto"' to allow any file type (images, PDFs, etc.)
    resource_type: 'auto',
  },
});

// A specific filter for IMAGES ONLY
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only image files.'), false);
  }
};

// Create the multer upload instances
const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5 MB limit
});

const uploadListingImages = multer({
  storage: listingImageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5 MB limit
});

// ## --- NEW: The uploader for chat documents --- ##
const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 1024 * 1024 * 10 } // 10 MB limit for any file
});

module.exports = {
  // For profile photos (field name 'profilePhoto')
  uploadProfilePhoto: uploadProfilePhoto.single('profilePhoto'),

  // For listing images (field name 'listingImages')
  uploadListingImages: uploadListingImages.array('listingImages', 5),
  
  // ## --- NEW: Export the document uploader --- ##
  uploadDocument: uploadDocument.single('document')
};