const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demandController');
const { verifyToken, isTrader, isBroker } = require('../middleware/authMiddleware');

// --- General Demand Routes ---
router.post('/', verifyToken, isTrader, demandController.createDemand);
router.get('/', verifyToken, isBroker, demandController.getAllDemands);
router.get('/my-demands', verifyToken, isTrader, demandController.getMyDemands);
router.get('/my-interests', verifyToken, isBroker, demandController.getMyInterests);
router.get('/:id', verifyToken, demandController.getDemandById);
router.delete('/:id', verifyToken, isTrader, demandController.deleteDemand);

// --- Demand Interaction Routes ---
router.post('/:id/interest', verifyToken, isBroker, demandController.toggleInterest);
router.post('/:demandId/complete/:brokerId', verifyToken, isTrader, demandController.completeDemand);
router.post('/:demandId/hire/:brokerId', verifyToken, isTrader, demandController.hireBroker);
router.delete('/:demandId/interest/:brokerId', verifyToken, isTrader, demandController.dismissBrokerInterest);
router.post('/:demandId/unhire/:brokerId', verifyToken, isTrader, demandController.unhireBroker);

// --- THE FIX: Added the new route for requesting details ---
router.post('/:id/request-details', verifyToken, isBroker, demandController.requestMoreDetails);


// --- Broker Workspace Routes ---
router.get('/workspace/hired', verifyToken, isBroker, demandController.getHiredDemands);
router.get('/workspace/pending', verifyToken, isBroker, demandController.getPendingInterests);

module.exports = router;