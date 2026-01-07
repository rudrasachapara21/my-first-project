const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demandController');
const { verifyToken, isTrader, isBroker } = require('../middleware/authMiddleware');
const { validateDemand } = require('../middleware/validators');

// --- General Demand Routes ---
router.post('/', verifyToken, isTrader, validateDemand, demandController.createDemand);
router.get('/', verifyToken, isBroker, demandController.getAllDemands);
router.get('/my-demands', verifyToken, isTrader, demandController.getMyDemands);
router.get('/my-interests', verifyToken, isBroker, demandController.getMyInterests);
router.get('/:id', verifyToken, demandController.getDemandById);
router.delete('/:id', verifyToken, isTrader, demandController.deleteDemand);

// --- User/Broker Public Routes ---
// New Route for Reviews
router.get('/broker/:brokerId/reviews', verifyToken, demandController.getBrokerReviews);

// --- NEW WORKFLOW ROUTES (Broker Hand Raise & Memo Logic) ---

// 1. Broker raises hand (New "Interest" logic)
router.post('/:demandId/raise-hand', verifyToken, isBroker, demandController.raiseHand);

// 2. Seller Hires Broker (Triggers "On Memo" Status)
router.post('/hire', verifyToken, isTrader, demandController.hireBroker);

// 3. Seller Marks Complete (The Detail Form Submit)
router.put('/:demandId/complete', verifyToken, isTrader, demandController.markCompleted);

// 4. Seller Returns Item (Un-hires broker, resets to active)
router.put('/:demandId/return', verifyToken, isTrader, demandController.returnItem);


// --- Legacy / Helper Routes ---
router.post('/:id/request-details', verifyToken, isBroker, demandController.requestMoreDetails);
router.delete('/:demandId/interest/:brokerId', verifyToken, isTrader, demandController.dismissBrokerInterest);
router.post('/:demandId/unhire/:brokerId', verifyToken, isTrader, demandController.unhireBroker);

// --- Broker Workspace Routes ---
router.get('/workspace/hired', verifyToken, isBroker, demandController.getHiredDemands);
router.get('/workspace/pending', verifyToken, isBroker, demandController.getPendingInterests);

module.exports = router;