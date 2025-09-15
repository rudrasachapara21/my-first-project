// routes/searchRoutes.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/users', verifyToken, searchController.searchUsers);

module.exports = router;
