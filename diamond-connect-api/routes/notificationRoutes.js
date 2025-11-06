const express = require('express');
const { 
  getNotifications, 
  markNotificationsAsRead, 
  markSingleNotificationAsRead // We will create this new function in the controller
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

// Route to get all notifications for the current user
router.get('/', getNotifications);

// Route to mark ALL notifications as read
router.put('/read', markNotificationsAsRead);

// ## NEW ROUTE ##
// Route to mark a SINGLE notification as read using its ID
router.put('/:id/read', markSingleNotificationAsRead);

module.exports = router;