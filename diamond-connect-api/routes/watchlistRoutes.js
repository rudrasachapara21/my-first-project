const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlistController');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   GET api/watchlist
// @desc    Get all items in the current user's watchlist
// @access  Private
router.get('/', verifyToken, watchlistController.getWatchlist);

// @route   POST api/watchlist/:listingId
// @desc    Add a listing to the user's watchlist
// @access  Private
router.post('/:listingId', verifyToken, watchlistController.addToWatchlist);

// @route   DELETE api/watchlist/:listingId
// @desc    Remove a listing from the user's watchlist
// @access  Private
router.delete('/:listingId', verifyToken, watchlistController.removeFromWatchlist);

module.exports = router;