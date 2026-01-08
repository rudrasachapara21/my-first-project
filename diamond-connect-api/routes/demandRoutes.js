const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demandController');
const { verifyToken, isTrader, isBroker } = require('../middleware/authMiddleware');

// ✅ FIXED: All callbacks now point to valid exported functions
router.post('/', verifyToken, isTrader, demandController.createDemand);
router.get('/', verifyToken, isBroker, demandController.getAllDemands);
router.get('/my-demands', verifyToken, isTrader, demandController.getMyDemands);
router.get('/my-interests', verifyToken, isBroker, demandController.getMyInterests);
router.get('/:id', verifyToken, demandController.getDemandById);
router.delete('/:id', verifyToken, isTrader, demandController.deleteDemand);

// Reviews
router.get('/broker/:brokerId/reviews', verifyToken, demandController.getBrokerReviews);

// Workflow Logic
router.post('/:demandId/raise-hand', verifyToken, isBroker, demandController.raiseHand);
router.post('/hire', verifyToken, isTrader, demandController.hireBroker);
router.put('/:demandId/complete', verifyToken, isTrader, demandController.markCompleted);
router.put('/:demandId/return', verifyToken, isTrader, demandController.returnItem);

// Helpers
router.post('/:id/request-details', verifyToken, isBroker, demandController.requestMoreDetails);
router.delete('/:demandId/interest/:brokerId', verifyToken, isTrader, demandController.dismissBrokerInterest);
router.post('/:demandId/unhire/:brokerId', verifyToken, isTrader, demandController.unhireBroker);

// Workspace
router.get('/workspace/hired', verifyToken, isBroker, demandController.getHiredDemands);
router.get('/workspace/pending', verifyToken, isBroker, demandController.getPendingInterests);

module.exports = router;