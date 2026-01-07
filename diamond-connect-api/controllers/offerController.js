const db = require('../db'); // Ensure this points to your DB connection
const { createNotification } = require('../services/notificationService');

// --- 1. MAKE AN OFFER (Start the Negotiation) ---
exports.createOffer = async (req, res, next) => {
    const { listingId } = req.params;
    const { offer_price } = req.body;
    const buyerId = req.user.user_id;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // A. Fetch listing details
        const listingQuery = 'SELECT user_id, shape, carat, clarity, cut, status FROM listings WHERE listing_id = $1';
        const listingResult = await client.query(listingQuery, [listingId]);
        
        if (listingResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Listing not found.' });
        }
        
        const listingData = listingResult.rows[0];
        const sellerId = listingData.user_id;
        const listingName = `${listingData.carat}ct ${listingData.shape} (${listingData.clarity})`;

        // B. Validations
        if (buyerId === sellerId) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'You cannot make an offer on your own listing.' });
        }
        if (listingData.status !== 'active') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Listing is not active.' });
        }

        // C. Create the Offer
        const offerQuery = `
            INSERT INTO offers (listing_id, buyer_id, seller_id, offer_price, status)
            VALUES ($1, $2, $3, $4, 'pending_seller') RETURNING *
        `;
        const { rows } = await client.query(offerQuery, [listingId, buyerId, sellerId, offer_price]);
        const newOffer = rows[0];

        // 🆕 D. LOG HISTORY (The Negotiation Dance)
        await client.query(
            `INSERT INTO offer_history (offer_id, changed_by_user_id, previous_price, new_price, status_change)
             VALUES ($1, $2, NULL, $3, 'created')`,
            [newOffer.offer_id, buyerId, offer_price]
        );

        // 🆕 E. LOG ACTIVITY (Security)
        await client.query(
            `INSERT INTO activity_logs (user_id, action_type, target_id, details, ip_address)
             VALUES ($1, 'CREATE_OFFER', $2, $3, $4)`,
            [buyerId, newOffer.offer_id, `Offered ₹${offer_price} for Listing #${listingId}`, req.ip]
        );
        
        // F. Notify Seller
        const buyerNameResult = await client.query('SELECT full_name FROM users WHERE user_id = $1', [buyerId]);
        const buyerName = buyerNameResult.rows[0].full_name;
        
        const message = `${buyerName} made an offer of ₹${offer_price} on your listing: ${listingName}`;
        const newNotification = await createNotification(client, sellerId, message, `/offers`);
        
        if (req.io) {
            const sellerSocketId = sellerId.toString();
            req.io.to(sellerSocketId).emit('new_offer', { message, offer: newOffer });
            req.io.to(sellerSocketId).emit('new_notification', newNotification);
        }
        
        await client.query('COMMIT');
        res.status(201).json({ message: 'Offer submitted successfully.', offer: newOffer });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

// --- 2. GET OFFERS (For Dashboard) ---
exports.getReceivedOffers = async (req, res, next) => {
    const userId = req.user.user_id;
    try {
        const query = `
            SELECT o.*, 
                   l.shape, l.carat, l.color, l.clarity, l.cut, l.image_urls, 
                   l.status AS listing_status,
                   u.full_name as buyer_name
            FROM offers o
            JOIN listings l ON o.listing_id = l.listing_id
            JOIN users u ON o.buyer_id = u.user_id
            WHERE o.seller_id = $1
            ORDER BY o.updated_at DESC;
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getMadeOffers = async (req, res, next) => {
    const userId = req.user.user_id;
    try {
        const query = `
            SELECT o.*, 
                   l.shape, l.carat, l.color, l.clarity, l.cut, l.image_urls, 
                   l.status AS listing_status,
                   u.full_name as seller_name
            FROM offers o
            JOIN listings l ON o.listing_id = l.listing_id
            JOIN users u ON o.seller_id = u.user_id
            WHERE o.buyer_id = $1
            ORDER BY o.updated_at DESC;
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};

// --- 3. RESPOND TO OFFER (The "Power" Function) ---
exports.respondToOffer = async (req, res, next) => {
    const { offerId } = req.params;
    const { responseType, newPrice } = req.body; 
    const userId = req.user.user_id;
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // A. Get details (Locked for update)
        const offerQuery = `
            SELECT o.*, l.price as original_listing_price,
                   u_buyer.full_name as buyer_name, u_seller.full_name as seller_name
            FROM offers o
            JOIN listings l ON o.listing_id = l.listing_id
            JOIN users u_buyer ON o.buyer_id = u_buyer.user_id
            JOIN users u_seller ON o.seller_id = u_seller.user_id
            WHERE o.offer_id = $1
            FOR UPDATE
        `;
        const { rows: offerRows } = await client.query(offerQuery, [offerId]);
        if (offerRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Offer not found.' });
        }
        const offer = offerRows[0];

        // B. Logic Split
        let updatedOffer;
        let notificationMessage = '';
        let recipientId = (userId === offer.seller_id) ? offer.buyer_id : offer.seller_id;

        // =================================================
        // OPTION 1: ACCEPT (Create Transaction & Close Deal)
        // =================================================
        if (responseType === 'accept') {
            
            // 1. Update Offer Status
            const updateOfferQuery = `UPDATE offers SET status = 'accepted', updated_at = NOW() WHERE offer_id = $1 RETURNING *`;
            updatedOffer = (await client.query(updateOfferQuery, [offerId])).rows[0];

            // 2. Reject all other offers for this listing (Clean up)
            await client.query(`UPDATE offers SET status = 'rejected' WHERE listing_id = $1 AND offer_id != $2`, [offer.listing_id, offerId]);

            // 3. Mark Listing as SOLD
            await client.query(`
                UPDATE listings 
                SET status = 'sold', 
                    buyer_id = $1, 
                    final_price = $2, 
                    sold_at = NOW()
                WHERE listing_id = $3
            `, [offer.buyer_id, offer.offer_price, offer.listing_id]);

            // 🆕 4. CREATE TRANSACTION (The Bank Record)
            const transResult = await client.query(`
                INSERT INTO transactions 
                (listing_id, buyer_id, seller_id, final_amount, payment_status, notes)
                VALUES ($1, $2, $3, $4, 'pending', 'Deal closed via Offer System')
                RETURNING transaction_id
            `, [offer.listing_id, offer.buyer_id, offer.seller_id, offer.offer_price]);
            
            const transactionId = transResult.rows[0].transaction_id;

            // 🆕 5. LOG HISTORY
            await client.query(
                `INSERT INTO offer_history (offer_id, changed_by_user_id, previous_price, new_price, status_change)
                 VALUES ($1, $2, $3, $3, 'accepted')`,
                [offerId, userId, offer.offer_price]
            );

            // 🆕 6. LOG ACTIVITY
            await client.query(
                `INSERT INTO activity_logs (user_id, action_type, target_id, details, ip_address)
                 VALUES ($1, 'ACCEPT_OFFER', $2, $3, $4)`,
                [userId, transactionId, `Sold Listing #${offer.listing_id} for ₹${offer.offer_price}`, req.ip]
            );

            notificationMessage = `🎉 Your offer of ₹${offer.offer_price} was ACCEPTED! Transaction #${transactionId} created.`;
        
        } 
        // =================================================
        // OPTION 2: REJECT
        // =================================================
        else if (responseType === 'reject') {
            updatedOffer = (await client.query(`UPDATE offers SET status = 'rejected', updated_at = NOW() WHERE offer_id = $1 RETURNING *`, [offerId])).rows[0];

            // Log History
            await client.query(
                `INSERT INTO offer_history (offer_id, changed_by_user_id, previous_price, new_price, status_change)
                 VALUES ($1, $2, $3, $3, 'rejected')`,
                [offerId, userId, offer.offer_price]
            );

            notificationMessage = `Your offer of ₹${offer.offer_price} was rejected.`;
        } 
        // =================================================
        // OPTION 3: COUNTER-OFFER
        // =================================================
        else if (responseType === 'counter') {
            if (!newPrice || isNaN(newPrice)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Valid price required for counter.' });
            }

            const newStatus = (offer.status === 'pending_seller') ? 'pending_buyer' : 'pending_seller';
            
            updatedOffer = (await client.query(
                `UPDATE offers SET status = $1, offer_price = $2, updated_at = NOW() WHERE offer_id = $3 RETURNING *`, 
                [newStatus, newPrice, offerId]
            )).rows[0];

            // 🆕 Log History (Crucial for negotiation charts)
            await client.query(
                `INSERT INTO offer_history (offer_id, changed_by_user_id, previous_price, new_price, status_change)
                 VALUES ($1, $2, $3, $4, 'countered')`,
                [offerId, userId, offer.offer_price, newPrice]
            );

            notificationMessage = `Counter-offer received: ₹${newPrice}.`;
        }

        // C. Send Notifications
        const newNotification = await createNotification(client, recipientId, notificationMessage, `/offers`);
        
        if (req.io) {
            req.io.to(recipientId.toString()).emit('offer_update', { offer: updatedOffer });
            req.io.to(recipientId.toString()).emit('new_notification', newNotification);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Response processed.', offer: updatedOffer });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in respondToOffer:", error);
        next(error);
    } finally {
        client.release();
    }
};