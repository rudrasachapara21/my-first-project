const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/statement', verifyToken, transactionController.getStatement);
router.get('/analytics', verifyToken, transactionController.getAnalytics);

module.exports = router;