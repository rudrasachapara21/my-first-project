const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');
// const { uploadProfilePhoto } = require('../middleware/fileUpload');
// Use server-side face validation middleware instead of direct cloudinary upload
const faceUpload = require('../middleware/faceUpload');

// @route   GET api/profile
// @desc    Get the profile of the currently logged-in user
// @access  Private (Authenticated users)
router.get('/', verifyToken, profileController.getUserProfile);

// @route   PUT api/profile
// @desc    Update the profile of the currently logged-in user
// @access  Private (Authenticated users)
// Note: Multer upload limits and allowed mime types are configured inside
// `middleware/faceUpload.js` (50MB limit, accepts jpeg/png/webp/tiff/heic).
router.put('/', [verifyToken, faceUpload], profileController.updateUserProfile);

module.exports = router;