const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   POST api/auth/register
// @desc    Register a new user (with pending verification)
// @access  Public
// ## CHANGE: Added the new register route ##
router.post('/register', authController.register);

module.exports = router;