const db = require('../db');

exports.createListing = async (req, res, next) => {
    const { price, diamond_details } = req.body;
    const traderId = req.user.user_id;
    
    // ## --- THIS IS THE FIX --- ##
    // 'req.files' is an array of files uploaded to Cloudinary.
    // 'file.path' contains the full, secure URL (e.g., https://res.cloudinary.com/...)
    const imageUrls = req.files ? req.files.map(file => file.path) : [];
    // ## --- END OF FIX --- ##

    try {
        if (!diamond_details) {
            return res.status(400).json({ message: 'Details are required.' });
        }
        
        const query = `
            INSERT INTO listings (trader_id, diamond_details, price, image_urls)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        const values = [traderId, diamond_details, price, imageUrls];
        const { rows } = await db.query(query, values);

        req.io.emit('new-listing', rows[0]);
        
        res.status(201).json({ message: 'Listing created successfully!', listing: rows[0] });
    } catch (error) {
        next(error);
    }
};

exports.getAllListings = async (req, res, next) => {
    const userId = req.user.user_id;
    try {
        const query = `
            SELECT l.*, u.full_name AS trader_name, u.office_name
            FROM listings l
            JOIN users u ON l.trader_id = u.user_id
            WHERE l.status = 'available' AND l.trader_id != $1
            ORDER BY l.created_at DESC
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getMyListings = async (req, res, next) => {
    const traderId = req.user.user_id;
    try {
        const query = 'SELECT * FROM listings WHERE trader_id = $1 ORDER BY created_at DESC';
        const { rows } = await db.query(query, [traderId]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getListingById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT l.*, u.full_name, u.office_name, u.phone_number, u.office_address, u.gst_number, u.profile_photo_url
            FROM listings l
            JOIN users u ON l.trader_id = u.user_id
            WHERE l.listing_id = $1
        `;
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.updateListing = async (req, res, next) => {
    const { id } = req.params;
    const { price, diamond_details } = req.body;
    const traderId = req.user.user_id;

    try {
        // First, verify the user owns the listing
        const ownerCheck = await db.query('SELECT trader_id FROM listings WHERE listing_id = $1', [id]);
        if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].trader_id !== traderId) {
            return res.status(403).json({ message: 'Forbidden: You do not own this listing.' });
        }

        // If ownership is verified, update the listing
        const updateQuery = `
            UPDATE listings 
            SET price = $1, diamond_details = $2 
            WHERE listing_id = $3 AND trader_id = $4
            RETURNING *
        `;
        const { rows } = await db.query(updateQuery, [price, diamond_details, id, traderId]);

        res.status(200).json({ message: 'Listing updated successfully!', listing: rows[0] });
    } catch (error) {
        next(error);
    }
};

exports.deleteListing = async (req, res, next) => {
    const { id } = req.params;
    const traderId = req.user.user_id;
    try {
        const query = 'DELETE FROM listings WHERE listing_id = $1 AND trader_id = $2 RETURNING listing_id';
        const { rows } = await db.query(query, [id, traderId]);
        if (rows.length === 0) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        req.io.emit('listing-deleted', { listingId: id });
        res.status(200).json({ message: 'Listing deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

exports.toggleListingInterest = async (req, res, next) => {
    const { id: listingId } = req.params;
    const interestedUserId = req.user.user_id;
    try {
        const existingQuery = 'SELECT * FROM listing_interests WHERE listing_id = $1 AND interested_user_id = $2';
        const { rows: existing } = await db.query(existingQuery, [listingId, interestedUserId]);
        if (existing.length > 0) {
            await db.query('DELETE FROM listing_interests WHERE listing_interest_id = $1', [existing[0].listing_interest_id]);
            res.status(200).json({ message: 'Interest removed' });
        } else {
            await db.query('INSERT INTO listing_interests (listing_id, interested_user_id) VALUES ($1, $2)', [listingId, interestedUserId]);
            const sellerQuery = 'SELECT trader_id FROM listings WHERE listing_id = $1';
            const { rows: listingRows } = await db.query(sellerQuery, [listingId]);
            if (listingRows.length > 0) {
                req.io.emit('listing-interest-received', { listingId, interestedUserId, sellerId: listingRows[0].trader_id });
            }
            res.status(201).json({ message: 'Interest registered successfully' });
        }
    } catch (error) {
        next(error);
    }
};

exports.getListingOffers = async (req, res, next) => {
    const { listingId } = req.params;
    const userId = req.user.user_id;

    try {
        const ownerCheck = await db.query('SELECT trader_id FROM listings WHERE listing_id = $1', [listingId]);
        if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].trader_id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You do not own this listing.' });
        }

        const offersQuery = `
            SELECT o.*, u.full_name as buyer_name
            FROM offers o
            JOIN users u ON o.buyer_id = u.user_id
            WHERE o.listing_id = $1
            ORDER BY o.created_at DESC
        `;
        const { rows } = await db.query(offersQuery, [listingId]);
        
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};