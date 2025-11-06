const db = require('../db');

/**
 * Retrieves all listings saved in the current user's watchlist.
 */
exports.getWatchlist = async (req, res, next) => {
    const { user_id } = req.user;
    try {
        const query = `
            SELECT l.*, u.full_name as trader_name
            FROM listings l
            JOIN watchlist w ON l.listing_id = w.listing_id
            JOIN users u ON l.trader_id = u.user_id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC;
        `;
        const { rows } = await db.query(query, [user_id]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

/**
 * Adds a listing to the current user's watchlist.
 */
exports.addToWatchlist = async (req, res, next) => {
    const { user_id } = req.user;
    const { listingId } = req.params;
    try {
        // "ON CONFLICT" prevents an error if the user tries to add the same item twice.
        const query = `
            INSERT INTO watchlist (user_id, listing_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, listing_id) DO NOTHING
            RETURNING watchlist_id;
        `;
        const { rows } = await db.query(query, [user_id, listingId]);
        if (rows.length > 0) {
            res.status(201).json({ message: 'Added to watchlist.' });
        } else {
            res.status(200).json({ message: 'Item is already in watchlist.' });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Removes a listing from the current user's watchlist.
 */
exports.removeFromWatchlist = async (req, res, next) => {
    const { user_id } = req.user;
    const { listingId } = req.params;
    try {
        const query = 'DELETE FROM watchlist WHERE user_id = $1 AND listing_id = $2';
        await db.query(query, [user_id, listingId]);
        res.status(200).json({ message: 'Removed from watchlist.' });
    } catch (error) {
        next(error);
    }
};