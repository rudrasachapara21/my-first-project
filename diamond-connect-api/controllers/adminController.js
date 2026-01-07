const db = require('../db');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');

/**
 * @desc    Get all users for the admin search list
 * @route   GET /api/admin/users
 * @access  Admin
 */
exports.adminGetAllUsers = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                user_id, 
                full_name, 
                office_name, 
                profile_photo_url,
                role,
                is_verified,
                is_suspended
            FROM users 
            WHERE role != 'admin' 
            ORDER BY full_name ASC
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a specific user's full profile details
 * @route   GET /api/admin/users/:userId/profile
 * @access  Admin
 */
exports.adminGetUserProfile = async (req, res, next) => {
    const { userId } = req.params;
    try {
        const userQuery = `
            SELECT 
                user_id, full_name, email, phone_number, office_name, role, is_verified,
                gst_number, office_address, reputation_points, created_at,
                is_suspended, 
                (SELECT COUNT(*) FROM demands WHERE user_id = $1) as total_demands,
                (SELECT COUNT(*) FROM listings WHERE user_id = $1) as total_listings
            FROM users
            WHERE user_id = $1
        `;
        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const statsQuery = `
            SELECT 
                COALESCE(AVG(rating), 0) AS average_rating, 
                COUNT(review_id) AS total_reviews
            FROM reviews
            WHERE reviewee_id = $1
        `;
        const statsResult = await db.query(statsQuery, [userId]);

        const profile = userResult.rows[0];
        const stats = statsResult.rows[0];

        res.status(200).json({
            ...profile,
            average_rating: parseFloat(stats.average_rating).toFixed(1),
            total_reviews: parseInt(stats.total_reviews, 10)
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all activity for a specific user (for tabs)
 * @route   GET /api/admin/users/:userId/activity
 * @access  Admin
 */
exports.adminGetUserActivity = async (req, res, next) => {
    const { userId } = req.params;
    try {
        // 1. Demands
        const demandsQuery = `
            SELECT demand_id, shape, min_carat, max_carat, color, clarity, status, created_at 
            FROM demands 
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;
        const demandsPromise = db.query(demandsQuery, [userId]);

        // 2. Listings
        const listingsQuery = `
            SELECT listing_id, shape, carat, color, clarity, price, status, created_at
            FROM listings
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;
        const listingsPromise = db.query(listingsQuery, [userId]);

        // 3. Offers Made
        const offersMadeQuery = `
            SELECT o.offer_id, o.offer_price, o.status, o.created_at, 
                   l.shape, l.carat, l.color, l.clarity
            FROM offers o
            JOIN listings l ON o.listing_id = l.listing_id
            WHERE o.buyer_id = $1
            ORDER BY o.created_at DESC
        `;
        const offersMadePromise = db.query(offersMadeQuery, [userId]);

        // 4. Offers Received
        const offersReceivedQuery = `
            SELECT o.offer_id, o.offer_price, o.status, o.created_at, 
                   l.shape, l.carat, l.color, l.clarity, 
                   u.full_name as buyer_name
            FROM offers o
            JOIN listings l ON o.listing_id = l.listing_id
            JOIN users u ON o.buyer_id = u.user_id
            WHERE o.seller_id = $1
            ORDER BY o.created_at DESC
        `;
        const offersReceivedPromise = db.query(offersReceivedQuery, [userId]);

        // 5. Reviews Given
        const reviewsGivenQuery = `
            SELECT r.*, u.full_name as reviewee_name
            FROM reviews r
            JOIN users u ON r.reviewee_id = u.user_id
            WHERE r.reviewer_id = $1
            ORDER BY r.created_at DESC
        `;
        const reviewsGivenPromise = db.query(reviewsGivenQuery, [userId]);

        // 6. Reviews Received
        const reviewsReceivedQuery = `
            SELECT r.*, u.full_name as reviewer_name
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.user_id
            WHERE r.reviewee_id = $1
            ORDER BY r.created_at DESC
        `;
        const reviewsReceivedPromise = db.query(reviewsReceivedQuery, [userId]);

        const [
            demandsResult,
            listingsResult,
            offersMadeResult,
            offersReceivedResult,
            reviewsGivenResult,
            reviewsReceivedResult
        ] = await Promise.all([
            demandsPromise,
            listingsPromise,
            offersMadePromise,
            offersReceivedPromise,
            reviewsGivenPromise,
            reviewsReceivedPromise
        ]);

        const formatDiamondString = (item) => {
            if (item.shape && item.carat) {
                return `${item.carat}ct ${item.shape} ${item.color || ''} ${item.clarity || ''}`;
            }
            if (item.min_carat) {
                return `${item.min_carat}-${item.max_carat}ct ${item.shape}`;
            }
            return 'Diamond Details';
        };

        const formatList = (list) => list.map(item => ({
            ...item,
            diamond_details: formatDiamondString(item)
        }));

        res.status(200).json({
            liveDemands: formatList(demandsResult.rows.filter(d => d.status === 'active')),
            completedDemands: formatList(demandsResult.rows.filter(d => d.status === 'completed')),
            currentListings: formatList(listingsResult.rows.filter(l => l.status === 'active' || l.status === 'available')),
            soldListings: formatList(listingsResult.rows.filter(l => l.status === 'sold')),
            offersMade: formatList(offersMadeResult.rows),
            offersReceived: formatList(offersReceivedResult.rows),
            reviewsGiven: reviewsGivenResult.rows,
            reviewsReceived: reviewsReceivedResult.rows
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle a user's suspension status
 * @route   PUT /api/admin/users/:userId/suspend
 * @access  Admin
 */
exports.adminToggleSuspendUser = async (req, res, next) => {
    const { userId } = req.params;
    const { suspend } = req.body; 

    if (typeof suspend !== 'boolean') {
        return res.status(400).json({ message: 'Invalid suspension status. Must be a boolean.' });
    }

    try {
        const query = `
            UPDATE users
            SET is_suspended = $1
            WHERE user_id = $2 AND role != 'admin'
            RETURNING user_id, full_name, is_suspended;
        `;
        const { rows } = await db.query(query, [suspend, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found or user is an admin.' });
        }

        const action = suspend ? 'suspended' : 'un-suspended';
        
        if (req.io && suspend) {
             req.io.to(userId.toString()).emit('force_logout', { message: 'Your account has been suspended.' });
        }

        res.status(200).json({
            message: `User '${rows[0].full_name}' has been ${action}.`,
            is_suspended: rows[0].is_suspended
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    List users awaiting admin approval (email verified but not approved)
 * @route   GET /api/admin/pending-users
 * @access  Admin
 */
exports.adminGetPendingUsers = async (req, res, next) => {
    try {
        const q = `
            SELECT user_id, full_name, email, role, created_at
            FROM users
            WHERE email_verified = TRUE AND is_verified = FALSE AND role != 'admin'
            ORDER BY created_at ASC
        `;
        const { rows } = await db.query(q);
        res.status(200).json(rows);
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Approve a user and send welcome email
 * @route   POST /api/admin/approve-user
 * @access  Admin
 */
exports.adminApproveUser = async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'userId is required' });

        const upd = `UPDATE users SET is_verified = TRUE WHERE user_id = $1 AND role != 'admin' RETURNING user_id, full_name, email`;
        const { rows } = await db.query(upd, [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found or invalid action' });

        const user = rows[0];
        
        // Attempt to send the approval email
        try {
            await sendApprovalEmail({ to: user.email, name: user.full_name });
            console.log(`[Admin] Approval email sent to ${user.email}`);
        } catch (e) {
            console.error(`[Admin] Failed to send approval email to ${user.email}:`, e.message);
        }

        return res.status(200).json({ message: `Approved ${user.full_name}`, userId: user.user_id });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Reject a user and send rejection email
 * @route   POST /api/admin/reject-user
 * @access  Admin
 */
exports.adminRejectUser = async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'userId is required' });

        // Get user details before deletion for the email
        const getUser = `SELECT user_id, full_name, email FROM users WHERE user_id = $1 AND role != 'admin'`;
        const { rows } = await db.query(getUser, [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found or invalid action' });

        const user = rows[0];

        // Delete the user from database
        const delQuery = `DELETE FROM users WHERE user_id = $1`;
        await db.query(delQuery, [userId]);

        // Attempt to send the rejection email
        try {
            await sendRejectionEmail({ to: user.email, name: user.full_name });
            console.log(`[Admin] Rejection email sent to ${user.email}`);
        } catch (e) {
            console.error(`[Admin] Failed to send rejection email to ${user.email}:`, e.message);
        }

        return res.status(200).json({ message: `Rejected and removed ${user.full_name}`, userId: user.user_id });
    } catch (err) {
        next(err);
    }
};

/**
 * ✅ NEW FUNCTION: Un-verify a user
 * @desc    Un-verify a user (moves them back to pending list)
 * @route   POST /api/admin/unverify-user
 * @access  Admin
 */
exports.unverifyUser = async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const query = `
            UPDATE users 
            SET is_verified = FALSE 
            WHERE user_id = $1 AND role != 'admin' 
            RETURNING user_id, full_name, email;
        `;
        
        const { rows } = await db.query(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found or user is an admin.' });
        }

        // Force logout the user if they are currently online via Socket.io
        if (req.io) {
            req.io.to(userId.toString()).emit('force_logout', { 
                message: 'Your verification has been revoked by an administrator.' 
            });
        }

        res.status(200).json({ 
            message: `User '${rows[0].full_name}' has been un-verified and moved to the pending list.`,
            userId: rows[0].user_id 
        });
    } catch (error) {
        next(error);
    }
};