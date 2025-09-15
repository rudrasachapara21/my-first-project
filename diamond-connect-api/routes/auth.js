// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware.js');

// @route   POST api/auth/login
// @desc    Authenticate Trader/Broker & get token
// @access  Public
router.post('/login', authController.login);

// @route   POST api/auth/admin/login
// @desc    Authenticate Admin & get token
// @access  Public
router.post('/admin/login', authController.adminLogin);

// @route   POST api/auth/create-user
// @desc    Admin creates a new user
// @access  Private (Admin only)
router.post('/create-user', [verifyToken, isAdmin], authController.createUser);

module.exports = router;