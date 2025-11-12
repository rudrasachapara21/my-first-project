const db = require('../db');

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
                role
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
        // 1. Get User Profile
        const userQuery = `
            SELECT 
                user_id, full_name, email, phone_number, office_name, role, is_verified,
                gst_number, office_address, reputation_points, created_at,
                is_suspended, -- <-- ADDED THIS
                (SELECT COUNT(*) FROM demands WHERE trader_id = $1) as total_demands,
                (SELECT COUNT(*) FROM listings WHERE trader_id = $1) as total_listings
            FROM users
            WHERE user_id = $1
        `;
        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Get User Stats (Reviews)
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
        // 1. Demands (Live & Completed)
        const demandsQuery = `
            SELECT demand_id, diamond_details, status, created_at 
            FROM demands 
            WHERE trader_id = $1
            ORDER BY created_at DESC
        `;
        const demandsPromise = db.query(demandsQuery, [userId]);

        // 2. Listings (Available & Sold)
        const listingsQuery = `
            SELECT listing_id, diamond_details, price, status, created_at
            FROM listings
            WHERE trader_id = $1
            ORDER BY created_at DESC
        `;
        const listingsPromise = db.query(listingsQuery, [userId]);

        // 3. Offers Made (by this user)
        const offersMadeQuery = `
            SELECT o.offer_id, o.offer_price, o.status, o.created_at, l.diamond_details
            FROM offers o
            JOIN listings l ON o.listing_id = l.listing_id
            WHERE o.buyer_id = $1
            ORDER BY o.created_at DESC
        `;
        const offersMadePromise = db.query(offersMadeQuery, [userId]);

        // 4. Offers Received (on this user's listings)
        const offersReceivedQuery = `
            SELECT o.offer_id, o.offer_price, o.status, o.created_at, l.diamond_details, u.full_name as buyer_name
            FROM offers o
            JOIN listings l ON o.listing_id = l.listing_id
            JOIN users u ON o.buyer_id = u.user_id
            WHERE o.seller_id = $1
            ORDER BY o.created_at DESC
        `;
        const offersReceivedPromise = db.query(offersReceivedQuery, [userId]);

        // 5. Reviews Given (by this user)
        const reviewsGivenQuery = `
            SELECT r.*, u.full_name as reviewee_name
            FROM reviews r
            JOIN users u ON r.reviewee_id = u.user_id
            WHERE r.reviewer_id = $1
            ORDER BY r.created_at DESC
        `;
        const reviewsGivenPromise = db.query(reviewsGivenQuery, [userId]);

        // 6. Reviews Received (by this user)
        const reviewsReceivedQuery = `
            SELECT r.*, u.full_name as reviewer_name
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.user_id
            WHERE r.reviewee_id = $1
            ORDER BY r.created_at DESC
        `;
        const reviewsReceivedPromise = db.query(reviewsReceivedQuery, [userId]);

        // Run all queries in parallel
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

        // Send the neatly packaged data
        res.status(200).json({
            liveDemands: demandsResult.rows.filter(d => d.status === 'active'),
            completedDemands: demandsResult.rows.filter(d => d.status === 'completed'),
            currentListings: listingsResult.rows.filter(l => l.status === 'available'),
            soldListings: listingsResult.rows.filter(l => l.status === 'sold'),
            offersMade: offersMadeResult.rows,
            offersReceived: offersReceivedResult.rows,
            reviewsGiven: reviewsGivenResult.rows,
            reviewsReceived: reviewsReceivedResult.rows
        });

    } catch (error) {
        next(error);
    }
};

// ## --- NEW FUNCTION --- ##
/**
 * @desc    Toggle a user's suspension status
 * @route   PUT /api/admin/users/:userId/suspend
 * @access  Admin
 */
exports.adminToggleSuspendUser = async (req, res, next) => {
    const { userId } = req.params;
    const { suspend } = req.body; // Expecting { "suspend": true } or { "suspend": false }

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
        // Invalidate this user's socket connection to force a re-login
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