const multer = require('multer');
// --- THE FIX: Correctly import the 'path' and 'fs' modules ---
const path = require('path');
const fs = require('fs');

// Use the Render Disk path in production, or a local folder for development
const uploadDir = process.env.RENDER_DISK_PATH || 'uploads';

// Ensure the upload directory exists on startup
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure the general storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // All files will now go to the permanent disk path on Render
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// A specific filter for IMAGES ONLY
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only image files.'), false);
    }
};

// A separate multer instance for generic documents (no file filter)
const documentUpload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10 // 10 MB limit for documents
    }
});

// The original multer instance, specifically for images
const imageUpload = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB limit for images
    }
});

module.exports = {
    // For secure documents in chat (field name 'document')
    uploadDocument: documentUpload,
    
    // For profile photos (field name 'profilePhoto')
    uploadProfilePhoto: imageUpload.single('profilePhoto'),

    // For listing images (field name 'listingImages')
    uploadListingImages: imageUpload.array('listingImages', 5)
};