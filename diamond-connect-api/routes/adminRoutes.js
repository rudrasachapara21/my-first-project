const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin access
router.use(verifyToken, isAdmin);

/**
 * @desc    Get all users for the admin search list
 * @route   GET /api/admin/users
 */
router.get('/users', adminController.adminGetAllUsers);

/**
 * @desc    Get a specific user's full profile
 * @route   GET /api/admin/users/:userId/profile
 */
router.get('/users/:userId/profile', adminController.adminGetUserProfile);

/**
 * @desc    Get all activity for a specific user (for tabs)
 * @route   GET /api/admin/users/:userId/activity
 */
router.get('/users/:userId/activity', adminController.adminGetUserActivity);

// ## --- NEW ROUTE --- ##
/**
 * @desc    Toggle a user's suspension status
 * @route   PUT /api/admin/users/:userId/suspend
 */
router.put('/users/:userId/suspend', adminController.adminToggleSuspendUser);


module.exports = router;