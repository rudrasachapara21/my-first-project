const express = require('express');
const router = express.Router();

const conversationController = require('../controllers/conversationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, conversationController.startConversation);
router.get('/', verifyToken, conversationController.getConversations);
router.get('/:id/messages', verifyToken, conversationController.getMessagesForConversation);

module.exports = router;
