const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { verifyToken, isTrader } = require('../middleware/authMiddleware');
const { uploadListingWithCert } = require('../middleware/fileUpload'); 

// --- NEW: Multer for passing PDF to Python (Memory Storage) ---
const multer = require('multer');
const upload = multer(); 

// --- 1. SPECIFIC GET ROUTES ---
router.get('/', verifyToken, listingController.getAllListings);
router.get('/my-listings', verifyToken, isTrader, listingController.getMyListings);
router.get('/user/me', verifyToken, isTrader, listingController.getMyListings);

// --- 2. NEW ROUTES ---
// Analyze PDF (Passes file to Python)
router.post('/analyze', verifyToken, upload.single('pdfFile'), listingController.analyzePdf);

// Fetch Certificate (Legacy method)
router.post('/fetch-report', verifyToken, listingController.fetchCertificateData);

// --- 3. DYNAMIC ROUTES ---
router.get('/:listingId/offers', verifyToken, isTrader, listingController.getListingOffers);
router.get('/:id', verifyToken, listingController.getListingById);

// --- 4. CREATE / UPDATE / DELETE ---
router.post('/', verifyToken, isTrader, uploadListingWithCert, listingController.createListing);
router.put('/:id', verifyToken, isTrader, listingController.updateListing);
router.delete('/:id', verifyToken, isTrader, listingController.deleteListing);

// Actions
router.post('/:id/interest', verifyToken, listingController.toggleListingInterest);
router.put('/:id/sold', verifyToken, isTrader, listingController.markSold);
router.put('/:id/reactivate', verifyToken, isTrader, listingController.reactivateListing);

module.exports = router;