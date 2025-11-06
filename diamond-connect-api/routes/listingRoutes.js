const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { verifyToken, isTrader } = require('../middleware/authMiddleware');
const { uploadListingImages } = require('../middleware/fileUpload');

// --- Collection Routes ---

router.post('/', verifyToken, isTrader, uploadListingImages, listingController.createListing);

router.get('/', verifyToken, listingController.getAllListings);

router.get('/my-listings', verifyToken, isTrader, listingController.getMyListings);


// --- Item-Specific Routes ---

router.get('/:id', verifyToken, listingController.getListingById);

// ## NEW: Route for updating a listing ##
router.put('/:id', verifyToken, isTrader, listingController.updateListing);

router.delete('/:id', verifyToken, isTrader, listingController.deleteListing);

router.post('/:id/interest', verifyToken, listingController.toggleListingInterest);

router.get('/:listingId/offers', verifyToken, isTrader, listingController.getListingOffers);


module.exports = router;