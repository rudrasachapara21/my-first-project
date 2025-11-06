const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/summary', verifyToken, statsController.getSummary);
router.get('/admin-summary', [verifyToken, isAdmin], statsController.getAdminSummary);
router.get('/user-growth', [verifyToken, isAdmin], statsController.getUserGrowthChartData);

module.exports = router;