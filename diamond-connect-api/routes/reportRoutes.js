const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// --- SAFETY CHECK ---
// This prevents the app from crashing if the import fails
const verifyToken = authMiddleware.verifyToken || authMiddleware; 

if (typeof verifyToken !== 'function') {
    console.error("❌ CRITICAL ERROR: 'verifyToken' is not a function.");
    console.error("   Check 'middleware/authMiddleware.js'. It should export: module.exports = { verifyToken };");
}
// --------------------

// @route   GET api/reports/statement
// @desc    Download PDF/Excel Statement
// @access  Private
router.get('/statement', verifyToken, reportController.generateStatement);

module.exports = router;