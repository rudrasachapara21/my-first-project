const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   POST api/offers/:listingId
// @desc    Create a new offer on a listing
// @access  Private
router.post('/:listingId', verifyToken, offerController.createOffer);

// @route   GET api/offers/received
// @desc    Get all offers received by the current user
// @access  Private
router.get('/received', verifyToken, offerController.getReceivedOffers);

// @route   GET api/offers/made
// @desc    Get all offers made by the current user
// @access  Private
router.get('/made', verifyToken, offerController.getMadeOffers);

// @route   PUT api/offers/:offerId/respond
// @desc    Respond to an offer (Accept, Reject, or Counter)
// @access  Private (Buyer or Seller)
router.put('/:offerId/respond', verifyToken, offerController.respondToOffer);

module.exports = router;