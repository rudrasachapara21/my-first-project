const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { verifyToken } = require('../middleware/authMiddleware');

// --- THE FIX: Changed the path from '/query' to '/' ---
// This will now correctly listen for POST requests at /api/support
router.post('/', verifyToken, supportController.submitQuery);

module.exports = router;