const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// @route   POST api/news
// @desc    Create a new news article
// @access  Private (Admin only)
router.post('/', [verifyToken, isAdmin], newsController.createNewsArticle);

// @route   GET api/news
// @desc    Get all news articles
// @access  Private (Authenticated users)
router.get('/', verifyToken, newsController.getAllNews);

// @route   GET api/news/:id
// @desc    Get a single news article by its ID
// @access  Private (Authenticated users)
router.get('/:id', verifyToken, newsController.getArticleById);

// @route   PUT api/news/:id
// @desc    Update an existing news article
// @access  Private (Admin only)
router.put('/:id', [verifyToken, isAdmin], newsController.updateNewsArticle);

// @route   DELETE api/news/:id
// @desc    Delete a news article
// @access  Private (Admin only)
router.delete('/:id', [verifyToken, isAdmin], newsController.deleteNewsArticle);

module.exports = router;