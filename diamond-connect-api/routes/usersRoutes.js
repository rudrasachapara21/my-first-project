// routes/usersRoutes.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// GET /api/users - Get all non-admin users
router.get('/', [verifyToken, isAdmin], usersController.getAllUsers);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', [verifyToken, isAdmin], usersController.deleteUser);

module.exports = router;