// routes/supportRoutes.js
const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/query', verifyToken, supportController.submitQuery);

module.exports = router;