const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const otpController = require('../controllers/otpController.js');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   POST api/auth/register
// @desc    Register a new user (with OTP email verification + admin approval pending)
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/verify-otp
// @desc    Verify email using OTP sent to the user's email
// @access  Public
router.post('/verify-otp', otpController.verifyRegistrationOtp);

// @route   POST api/auth/resend-otp
// @desc    Resend OTP to a registered (but unverified) email
// @access  Public
router.post('/resend-otp', otpController.resendRegistrationOtp);

// @route   POST api/auth/refresh
// @desc    Refresh JWT token
// @access  Public
router.post('/refresh', authController.refreshToken);

module.exports = router;