const db = require('../db');

/**
 * Searches for listings and demands based on a query string.
 * The search is performed on the listing's title and the JSON details of both.
 * @access Private (Authenticated users)
 */
exports.searchMarketplace = async (req, res, next) => {
    // Using 'q' as the query parameter is a common convention for search
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: "A search query 'q' is required." });
    }

    try {
        const searchTerm = `%${q}%`;

        // Query for listings (searching title and details)
        const listingsQuery = `
            SELECT listing_id, title, price, image_urls, status, created_at
            FROM listings
            WHERE (title ILIKE $1 OR diamond_details::text ILIKE $1) AND status = 'available'
            ORDER BY created_at DESC
            LIMIT 20;
        `;

        // Query for demands (searching details)
        const demandsQuery = `
            SELECT demand_id, diamond_details, status, created_at
            FROM demands
            WHERE (diamond_details::text ILIKE $1) AND status = 'active'
            ORDER BY created_at DESC
            LIMIT 20;
        `;

        // Execute both queries in parallel for efficiency
        const [listingsResult, demandsResult] = await Promise.all([
            db.query(listingsQuery, [searchTerm]),
            db.query(demandsQuery, [searchTerm])
        ]);

        res.status(200).json({
            listings: listingsResult.rows,
            demands: demandsResult.rows
        });

    } catch (error) {
        console.error("Marketplace search error:", error);
        next(error);
    }
};

/**
 * Searches for users by their full name or office name.
 * Excludes the current user and admins from the results.
 * @access Private (Authenticated users)
 */
exports.searchUsers = async (req, res, next) => {
    // Renamed to 'name' for clarity, as it can be a person's name or company name
    const { name } = req.query;
    // BUG FIX: Changed req.user.userId to req.user.user_id
    const currentUserId = req.user.user_id;

    if (!name) {
        return res.status(400).json({ message: "A search query 'name' is required." });
    }

    try {
        // IMPROVEMENT: Search both full_name and office_name for better results
        const searchQuery = `
            SELECT user_id, full_name, role, office_name, profile_photo_url
            FROM users
            WHERE (full_name ILIKE $1 OR office_name ILIKE $1)
              AND user_id != $2
              AND role != 'admin'
            LIMIT 10
        `;
        const { rows } = await db.query(searchQuery, [`%${name}%`, currentUserId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("User search error:", error);
        next(error);
    }
};