// routes/pricingRoutes.js
const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController.js');
const { verifyToken } = require('../middleware/authMiddleware.js');

// @route   POST api/pricing/estimate
// @desc    Get an estimated price for a diamond
// @access  Private (Any logged-in user)
router.post('/estimate', verifyToken, pricingController.getPriceEstimate);

module.exports = router;