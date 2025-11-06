const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Get and Update the logged-in user's notification preferences
router.route('/me/preferences')
  .get(verifyToken, usersController.getUserPreferences)
  .put(verifyToken, usersController.updateUserPreferences);

// Update the logged-in user's password
router.put('/me/password', verifyToken, usersController.changePassword);

// --- THE FIX: Added the new route for toggling verification status ---
// Admin: Verify or un-verify a broker
router.post('/:id/verify', [verifyToken, isAdmin], usersController.toggleUserVerification);

// Admin: Create a new user
router.post('/', [verifyToken, isAdmin], usersController.createUser);

// Admin: Get all users
router.get('/', [verifyToken, isAdmin], usersController.getAllUsers);

// Get a single user's public profile
router.get('/:id', verifyToken, usersController.getUserById);

// Admin: Delete a user
router.delete('/:id', [verifyToken, isAdmin], usersController.deleteUser);

// ## --- NEW ROUTE ADDED --- ##
//
// @route   GET /api/users/:id/reviews
// @desc    Get all reviews and stats for a specific user
// @access  Private
router.get('/:id/reviews', verifyToken, usersController.getUserReviews);

module.exports = router;