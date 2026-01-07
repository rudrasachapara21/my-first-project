const db = require('../db');

exports.getWatchlist = async (req, res, next) => {
    const userId = req.user.user_id;
    try {
        // ✅ FIX: Joined on l.user_id instead of l.trader_id
        // ✅ FIX: Selected l.* to get the new flat columns (carat, shape, etc.)
        const query = `
            SELECT w.watchlist_id, w.created_at as saved_at,
                   l.*, 
                   u.full_name as trader_name, 
                   u.office_name
            FROM watchlist w
            JOIN listings l ON w.listing_id = l.listing_id
            JOIN users u ON l.user_id = u.user_id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC
        `;
        
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.addToWatchlist = async (req, res, next) => {
    const { listingId } = req.params;
    const userId = req.user.user_id;

    try {
        // Check if already in watchlist
        const checkQuery = 'SELECT * FROM watchlist WHERE user_id = $1 AND listing_id = $2';
        const checkResult = await db.query(checkQuery, [userId, listingId]);

        if (checkResult.rowCount > 0) {
            return res.status(400).json({ message: 'Item already in watchlist.' });
        }

        const insertQuery = `
            INSERT INTO watchlist (user_id, listing_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        const { rows } = await db.query(insertQuery, [userId, listingId]);
        
        res.status(201).json({ message: 'Added to watchlist', item: rows[0] });
    } catch (error) {
        next(error);
    }
};

exports.removeFromWatchlist = async (req, res, next) => {
    const { listingId } = req.params;
    const userId = req.user.user_id;

    try {
        const query = 'DELETE FROM watchlist WHERE user_id = $1 AND listing_id = $2 RETURNING *';
        const { rows } = await db.query(query, [userId, listingId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Item not found in watchlist.' });
        }

        res.status(200).json({ message: 'Removed from watchlist' });
    } catch (error) {
        next(error);
    }
};