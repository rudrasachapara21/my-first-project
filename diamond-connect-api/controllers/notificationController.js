const db = require('../db');

/**
 * @desc    Get notifications for the logged-in user.
 * @note    IMPROVEMENT: Now fetches only unread notifications by default.
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
    try {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1 AND is_read = false
            ORDER BY created_at DESC
        `;
        const { rows } = await db.query(query, [req.user.user_id]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark multiple notifications as read (for "Mark All Read").
 * @route   PUT /api/notifications/read
 * @access  Private
 */
exports.markNotificationsAsRead = async (req, res, next) => {
    try {
        const { notificationIds } = req.body;

        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({ message: 'Notification IDs must be provided as a non-empty array.' });
        }

        const query = `
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE user_id = $1 AND id = ANY($2::int[])
            RETURNING id;
        `;
        const { rows } = await db.query(query, [req.user.user_id, notificationIds]);
        
        res.status(200).json({ 
            message: 'Notifications marked as read.',
            updatedIds: rows.map(r => r.id) 
        });
    } catch (error)
        {
        next(error);
    }
};


/**
 * ## NEW FUNCTION ##
 * @desc    Mark a single notification as read.
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markSingleNotificationAsRead = async (req, res, next) => {
    try {
        const { id } = req.params; // Get the notification ID from the URL
        const userId = req.user.user_id;

        const query = `
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = $1 AND user_id = $2
            RETURNING *;
        `;
        const { rows } = await db.query(query, [id, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found or user not authorized.' });
        }

        res.status(200).json({ message: 'Notification marked as read.', notification: rows[0] });
    } catch (error) {
        next(error);
    }
};