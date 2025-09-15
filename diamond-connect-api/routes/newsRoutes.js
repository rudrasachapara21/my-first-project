// routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// GET /api/news - Get all news articles
router.get('/', verifyToken, newsController.getAllNews);

// POST /api/news - Create a new article
router.post('/', [verifyToken, isAdmin], newsController.createNewsArticle);

// GET /api/news/:id - Get a single article by ID
// This must be placed before the delete route to be correctly matched
router.get('/:id', verifyToken, newsController.getArticleById);

// DELETE /api/news/:id - Delete an article
router.delete('/:id', [verifyToken, isAdmin], newsController.deleteNewsArticle);

module.exports = router;