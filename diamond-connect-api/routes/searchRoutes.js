const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   GET api/search
// @desc    Search for listings and demands in the marketplace
// @access  Private (Authenticated users)
router.get('/', verifyToken, searchController.searchMarketplace);

// @route   GET api/search/users
// @desc    Search for users (Traders/Brokers) by name or company
// @access  Private (Authenticated users)
router.get('/users', verifyToken, searchController.searchUsers);

module.exports = router;