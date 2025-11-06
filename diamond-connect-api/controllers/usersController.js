const db = require('../db');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res, next) => {
    const { fullName, email, password, role, gstNumber, officeAddress, phoneNumber, officeName } = req.body;
    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: "fullName, email, password, and role are required." });
    }
    if (role === 'admin') {
        return res.status(403).json({ message: "Cannot create a user with the 'admin' role." });
    }
    if (!['trader', 'broker'].includes(role)) {
        return res.status(400).json({ message: "Role must be either 'trader' or 'broker'." });
    }
    try {
        const passwordHash = await bcrypt.hash(password, 12);
        
        // ## FIX: Set is_verified = true by default when admin creates user ##
        const query = `
            INSERT INTO users (full_name, email, password_hash, role, gst_number, office_address, phone_number, office_name, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING user_id, full_name, email, role, created_at, is_verified
        `;
        const values = [fullName, email, passwordHash, role, gstNumber, officeAddress, phoneNumber, officeName];
        
        const { rows } = await db.query(query, values);
        
        req.io.emit('user-created', rows[0]); 
        
        res.status(201).json({ message: "User created successfully!", user: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const query = `
            SELECT user_id, full_name, email, phone_number, office_name, role, is_verified
            FROM users WHERE role != 'admin' ORDER BY created_at DESC
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getUserById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT user_id, full_name, role, profile_photo_url, office_name, 
                   office_address, reputation_points, phone_number, gst_number, is_verified
            FROM users
            WHERE user_id = $1
        `;
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    const { id } = req.params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM demand_interests WHERE broker_id = $1', [id]);
        await client.query('DELETE FROM demands WHERE trader_id = $1', [id]);
        await client.query('DELETE FROM listings WHERE trader_id = $1', [id]);
        await client.query('DELETE FROM watchlist WHERE user_id = $1', [id]);
        await client.query('DELETE FROM listing_interests WHERE interested_user_id = $1', [id]);
        const deleteQuery = 'DELETE FROM users WHERE user_id = $1 RETURNING user_id, full_name';
        const result = await client.query(deleteQuery, [id]);
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User not found' });
        }
        await client.query('COMMIT');
        req.io.emit('user-deleted', { userId: id });
        res.json({ message: `User '${result.rows[0].full_name}' was deleted successfully.` });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

exports.getUserPreferences = async (req, res, next) => {
    try {
        const query = `
            SELECT notify_new_demands, notify_hand_raises, notify_news_updates
            FROM users
            WHERE user_id = $1
        `;
        const { rows } = await db.query(query, [req.user.user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const preferences = {
            newDemands: rows[0].notify_new_demands,
            handRaises: rows[0].notify_hand_raises,
            newsUpdates: rows[0].notify_news_updates
        };

        res.status(200).json(preferences);
    } catch (error) {
        next(error);
    }
};

exports.updateUserPreferences = async (req, res, next) => {
    try {
        const { newDemands, handRaises, newsUpdates } = req.body;

        if (typeof newDemands !== 'boolean' || typeof handRaises !== 'boolean' || typeof newsUpdates !== 'boolean') {
            return res.status(400).json({ message: 'Invalid preference values. Must be boolean.' });
        }
        
        const query = `
            UPDATE users
            SET 
                notify_new_demands = $1,
                notify_hand_raises = $2,
                notify_news_updates = $3
            WHERE user_id = $4
            RETURNING notify_new_demands, notify_hand_raises, notify_news_updates;
        `;
        
        const values = [newDemands, handRaises, newsUpdates, req.user.user_id];
        const { rows } = await db.query(query, values);

        res.status(200).json({ 
            message: 'Preferences updated successfully!',
            preferences: {
                newDemands: rows[0].notify_new_demands,
                handRaises: rows[0].notify_hand_raises,
                newsUpdates: rows[0].notify_news_updates
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.user_id;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All password fields are required.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New password and confirmation do not match.' });
    }

    try {
        const userQuery = 'SELECT password_hash FROM users WHERE user_id = $1';
        const { rows } = await db.query(userQuery, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 12);
        const updateQuery = 'UPDATE users SET password_hash = $1 WHERE user_id = $2';
        await db.query(updateQuery, [newPasswordHash, userId]);

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        next(error);
    }
};

exports.toggleUserVerification = async (req, res, next) => {
    const { id: userIdToVerify } = req.params;
    const { is_verified } = req.body;

    if (typeof is_verified !== 'boolean') {
        return res.status(400).json({ message: 'Invalid verification status. Must be a boolean.' });
    }

    try {
        const query = `
            UPDATE users
            SET is_verified = $1
            WHERE user_id = $2 AND role != 'admin'
            RETURNING user_id, full_name, is_verified;
        `;
        
        const { rows } = await db.query(query, [is_verified, userIdToVerify]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found or user is an admin.' });
        }

        const action = is_verified ? 'verified' : 'un-verified';
        res.status(200).json({ 
            message: `User '${rows[0].full_name}' has been successfully ${action}.`
        });
    } catch (error) {
        console.error("Error updating verification status:", error);
        next(error);
    }
};

// ## --- NEW FUNCTION ADDED --- ##
//
// @desc    Get all reviews and stats for a specific user
// @route   GET /api/users/:id/reviews
// @access  Private
exports.getUserReviews = async (req, res, next) => {
    const { id } = req.params;

    try {
        // Query 1: Get the stats (Average Rating and Total Count)
        const statsQuery = `
            SELECT 
                AVG(rating) AS average_rating, 
                COUNT(review_id) AS total_reviews
            FROM reviews
            WHERE reviewee_id = $1
        `;
        const statsResult = await db.query(statsQuery, [id]);
        
        // Query 2: Get the list of all reviews, joining with user table for reviewer's name
        const reviewsQuery = `
            SELECT r.review_id, r.rating, r.review_text, r.created_at, u.full_name AS reviewer_name, u.profile_photo_url AS reviewer_photo
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.user_id
            WHERE r.reviewee_id = $1
            ORDER BY r.created_at DESC
        `;
        const reviewsResult = await db.query(reviewsQuery, [id]);

        // Format the stats (handle null/0 cases)
        const stats = statsResult.rows[0];
        const average_rating = stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : 0;
        const total_reviews = parseInt(stats.total_reviews, 10);

        // Send the combined response
        res.status(200).json({
            stats: {
                average_rating: average_rating,
                total_reviews: total_reviews
            },
            reviews: reviewsResult.rows
        });

    } catch (error) {
        console.error("Error fetching user reviews:", error);
        next(error);
    }
};