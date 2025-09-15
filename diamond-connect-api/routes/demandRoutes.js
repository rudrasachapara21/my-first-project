// routes/demandRoutes.js
const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demandController.js');
const { verifyToken, isTrader, isBroker } = require('../middleware/authMiddleware.js');

// @route   POST api/demands
// @desc    Create a new demand
// @access  Private (Trader only)
router.post('/', [verifyToken, isTrader], demandController.createDemand);

// @route   GET api/demands
// @desc    Get all demands
// @access  Private (All logged-in users)
router.get('/', verifyToken, demandController.getAllDemands);

// @route   GET api/demands/my
// @desc    Get all demands for the logged-in user
// @access  Private (All logged-in users)
router.get('/my', verifyToken, demandController.getMyDemands);

// @route   GET api/demands/:id
// @desc    Get a single demand by ID
// @access  Private (All logged-in users)
router.get('/:id', verifyToken, demandController.getDemandById);

// @route   DELETE api/demands/:id
// @desc    Delete a demand
// @access  Private (Owner Trader only)
router.delete('/:id', [verifyToken, isTrader], demandController.deleteDemand);

// @route   POST api/demands/:id/raise-hand
// @desc    Broker raises hand on a specific demand
// @access  Private (Broker only)
router.post('/:id/raise-hand', [verifyToken, isBroker], demandController.raiseHandOnDemand);

// @route   GET api/demands/:id/interests
// @desc    Get all brokers interested in a specific demand
// @access  Private (Owner Trader only)
router.get('/:id/interests', [verifyToken, isTrader], demandController.getDemandInterests);

module.exports = router;