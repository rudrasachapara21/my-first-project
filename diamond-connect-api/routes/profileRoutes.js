// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/fileUpload');

// Route to get the user's profile
router.get('/', verifyToken, profileController.getUserProfile);

// Route to update the user's profile, including a single photo upload from a field named 'photo'
router.put('/', verifyToken, upload.single('photo'), profileController.updateUserProfile);

module.exports = router;