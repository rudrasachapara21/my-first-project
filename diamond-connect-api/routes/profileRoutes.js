const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadProfilePhoto } = require('../middleware/fileUpload');

// @route   GET api/profile
// @desc    Get the profile of the currently logged-in user
// @access  Private (Authenticated users)
router.get('/', verifyToken, profileController.getUserProfile);

// @route   PUT api/profile
// @desc    Update the profile of the currently logged-in user
// @access  Private (Authenticated users)
router.put('/', [verifyToken, uploadProfilePhoto], profileController.updateUserProfile);

module.exports = router;