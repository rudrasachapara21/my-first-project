// routes/listingRoutes.js
const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController.js');
const { verifyToken, isTrader } = require('../middleware/authMiddleware.js');
const upload = require('../middleware/fileUpload.js'); // The file upload middleware

// @route   POST api/listings
// @desc    Create a new listing for sale
// @access  Private (Trader only)
router.post('/', [verifyToken, isTrader], upload.single('image'), listingController.createListing);

// @route   GET api/listings
// @desc    Get all listings
// @access  Private (All logged-in users)
router.get('/', verifyToken, listingController.getAllListings);

// @route   POST api/listings/:id/raise-hand
// @desc    User raises hand on a specific listing
// @access  Private (Any logged-in user)
router.post('/:id/raise-hand', verifyToken, listingController.raiseHandOnListing);

// @route   GET api/listings/:id/interests
// @desc    Get all users interested in a specific listing
// @access  Private (Owner Trader only)
router.get('/:id/interests', [verifyToken, isTrader], listingController.getListingInterests);

module.exports = router;