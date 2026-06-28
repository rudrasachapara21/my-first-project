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
        
        const query = `
            INSERT INTO users (full_name, email, password_hash, role, gst_number, office_address, phone_number, office_name, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING user_id, full_name, email, role, created_at, is_verified
        `;
        const values = [fullName, email, passwordHash, role, gstNumber, officeAddress, phoneNumber, officeName];
        
        const { rows } = await db.query(query, values);
        
        if (req.io) req.io.emit('user-created', rows[0]); 
        
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
        // Only return users who have verified their email via OTP
        // Unverified OTP users should NOT appear in admin panel
        const query = `
            SELECT user_id, full_name, email, phone_number, office_name, role, is_verified, email_verified
            FROM users 
            WHERE role != 'admin' AND email_verified = TRUE
            ORDER BY created_at DESC
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

        // 1. Delete Interests
        await client.query('DELETE FROM demand_interests WHERE broker_id = $1', [id]);
        await client.query('DELETE FROM listing_interests WHERE interested_user_id = $1', [id]);

        // 2. Delete Offers & Reviews (Prevents Foreign Key Errors)
        await client.query('DELETE FROM offers WHERE buyer_id = $1 OR seller_id = $1', [id]);
        await client.query('DELETE FROM reviews WHERE reviewer_id = $1 OR reviewee_id = $1', [id]);

        // 3. Delete Notifications & Watchlist
        await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
        await client.query('DELETE FROM watchlist WHERE user_id = $1', [id]);

        // 4. Delete Demands & Listings (FIX: Used 'user_id' instead of 'trader_id')
        await client.query('DELETE FROM demands WHERE user_id = $1', [id]);
        await client.query('DELETE FROM listings WHERE user_id = $1', [id]);

        // 5. Finally, Delete the User
        const deleteQuery = 'DELETE FROM users WHERE user_id = $1 RETURNING user_id, full_name';
        const result = await client.query(deleteQuery, [id]);
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User not found' });
        }

        await client.query('COMMIT');
        
        if (req.io) req.io.emit('user-deleted', { userId: id });
        
        res.json({ message: `User '${result.rows[0].full_name}' was deleted successfully.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Delete User Error:", error);
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

exports.getUserReviews = async (req, res, next) => {
    const { id } = req.params;

    try {
        const statsQuery = `
            SELECT 
                AVG(rating) AS average_rating, 
                COUNT(review_id) AS total_reviews
            FROM reviews
            WHERE reviewee_id = $1
        `;
        const statsResult = await db.query(statsQuery, [id]);
        
        const reviewsQuery = `
            SELECT r.review_id, r.rating, r.review_text, r.created_at, u.full_name AS reviewer_name, u.profile_photo_url AS reviewer_photo
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.user_id
            WHERE r.reviewee_id = $1
            ORDER BY r.created_at DESC
        `;
        const reviewsResult = await db.query(reviewsQuery, [id]);

        const stats = statsResult.rows[0];
        const average_rating = stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : 0;
        const total_reviews = parseInt(stats.total_reviews, 10);

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