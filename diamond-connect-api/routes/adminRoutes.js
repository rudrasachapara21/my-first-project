const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin access
// This middleware ensures only logged-in admins can trigger approvals/rejections
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

// ## --- USER MANAGEMENT ROUTES --- ##

/**
 * @desc    Toggle a user's suspension status
 * @route   PUT /api/admin/users/:userId/suspend
 */
router.put('/users/:userId/suspend', adminController.adminToggleSuspendUser);

/**
 * @desc    Get users awaiting approval (email verified but not approved)
 * @route   GET /api/admin/pending-users
 */
router.get('/pending-users', adminController.adminGetPendingUsers);

/**
 * @desc    Approve a user (Triggers sendApprovalEmail)
 * @route   POST /api/admin/approve-user
 */
router.post('/approve-user', adminController.adminApproveUser);

/**
 * @desc    Reject a user (Triggers sendRejectionEmail and deletes user)
 * @route   POST /api/admin/reject-user
 */
router.post('/reject-user', adminController.adminRejectUser);

/**
 * ✅ NEW ROUTE: Un-verify a user
 * @desc    Revokes verification status and moves user back to pending
 * @route   POST /api/admin/unverify-user
 */
router.post('/unverify-user', adminController.unverifyUser);

module.exports = router;