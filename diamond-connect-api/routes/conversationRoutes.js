const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { verifyToken } = require('../middleware/authMiddleware');
// --- CHANGE: Import the correct uploader ---
const { uploadDocument } = require('../middleware/fileUpload');

// @route   POST api/conversations
// @desc    Create/Get a conversation
router.post('/', verifyToken, conversationController.createOrGetConversation);

// @route   GET api/conversations
// @desc    Get user's conversations
router.get('/', verifyToken, conversationController.getUserConversations);

// @route   GET api/conversations/:id/messages
// @desc    Get messages for a conversation
router.get('/:id/messages', verifyToken, conversationController.getConversationMessages);

// @route   POST api/conversations/:id/documents
// @desc    Upload a document to a conversation
router.post(
    '/:id/documents', 
    verifyToken, 
    // --- CHANGE: Use the new, correct middleware ---
    uploadDocument.single('document'), 
    conversationController.uploadDocumentInConversation
);

module.exports = router;