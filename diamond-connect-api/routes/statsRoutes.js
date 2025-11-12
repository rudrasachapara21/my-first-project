const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/stats/summary
// @desc    Get dashboard stats for the logged-in user (Trader or Broker)
// @access  Private
router.get('/summary', verifyToken, statsController.getSummary);

// @route   GET /api/stats/admin-summary
// @desc    Get dashboard stats for the admin
// @access  Admin
router.get('/admin-summary', verifyToken, isAdmin, statsController.getAdminSummary);

// @route   GET /api/stats/user-growth
// @desc    Get user growth data for the admin chart
// @access  Admin
router.get('/user-growth', verifyToken, isAdmin, statsController.getUserGrowthChartData);

// ## --- NEW ROUTE 1 --- ##
// @route   GET /api/stats/market-activity
// @desc    Get daily demands/listings for the admin bar chart
// @access  Admin
router.get('/market-activity', verifyToken, isAdmin, statsController.getMarketActivity);

// ## --- NEW ROUTE 2 --- ##
// @route   GET /api/stats/user-verification
// @desc    Get verified vs pending user counts for the admin donut chart
// @access  Admin
router.get('/user-verification', verifyToken, isAdmin, statsController.getUserVerificationStats);

module.exports = router;