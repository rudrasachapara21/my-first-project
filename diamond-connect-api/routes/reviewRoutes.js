const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   POST api/reviews
// @desc    Create a new review for a completed offer
// @access  Private
router.post('/', verifyToken, reviewController.createReview);

module.exports = router;