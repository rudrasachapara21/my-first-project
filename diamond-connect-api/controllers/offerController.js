const db = require('../db');
const { createNotification } = require('../services/notificationService');

exports.createOffer = async (req, res, next) => {
    const { listingId } = req.params;
    const { offer_price } = req.body;
    const buyerId = req.user.user_id;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const listingQuery = 'SELECT trader_id, diamond_details FROM listings WHERE listing_id = $1';
        const listingResult = await client.query(listingQuery, [listingId]);
        if (listingResult.rowCount === 0) {
            return res.status(404).json({ message: 'Listing not found.' });
        }
        const sellerId = listingResult.rows[0].trader_id;
        
        const details = listingResult.rows[0].diamond_details;
        const listingName = `${details.carat || '?'}ct ${details.clarity || ''} ${details.cut || ''}` || `Listing #${listingId}`;

        if (buyerId === sellerId) {
            return res.status(400).json({ message: 'You cannot make an offer on your own listing.' });
        }

        const buyerQuery = 'SELECT full_name FROM users WHERE user_id = $1';
        const buyerResult = await client.query(buyerQuery, [buyerId]);
        const buyerName = buyerResult.rows[0].full_name;

        const offerQuery = `
            INSERT INTO offers (listing_id, buyer_id, seller_id, offer_price, status)
            VALUES ($1, $2, $3, $4, 'pending_seller') RETURNING *
        `;
        const { rows } = await client.query(offerQuery, [listingId, buyerId, sellerId, offer_price]);
        const newOffer = rows[0];
        
        const message = `${buyerName} made an offer of ₹${offer_price} on your listing: ${listingName}`;
        const linkUrl = `/offers`;
        const newNotification = await createNotification(client, sellerId, message, linkUrl);
        
        if (req.io) {
            const sellerSocketId = sellerId.toString();
            req.io.to(sellerSocketId).emit('new_offer', {
                message: `You have a new offer on ${listingName}`,
                offer: newOffer
            });
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

exports.getReceivedOffers = async (req, res, next) => {
    const userId = req.user.user_id;
    try {
        const query = `
            SELECT o.*, l.diamond_details, l.image_urls, u.full_name as buyer_name
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
            SELECT o.*, l.diamond_details, l.image_urls, u.full_name as seller_name
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

exports.respondToOffer = async (req, res, next) => {
    const { offerId } = req.params;
    const { responseType, newPrice } = req.body; // responseType: 'accept', 'reject', or 'counter'
    const userId = req.user.user_id;
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Get the current offer and verify the user
        const offerQuery = `
            SELECT o.*, l.diamond_details, u_buyer.full_name as buyer_name, u_seller.full_name as seller_name
            FROM offers o
            JOIN listings l ON o.listing_id = l.listing_id
            JOIN users u_buyer ON o.buyer_id = u_buyer.user_id
            JOIN users u_seller ON o.seller_id = u_seller.user_id
            WHERE o.offer_id = $1
        `;
        const { rows: offerRows } = await client.query(offerQuery, [offerId]);
        if (offerRows.length === 0) {
            return res.status(404).json({ message: 'Offer not found.' });
        }

        const offer = offerRows[0];
        const details = offer.diamond_details;
        const listingName = `${details.carat || '?'}ct ${details.clarity || ''}` || `Listing #${offer.listing_id}`;

        // 2. Authorization: Check if it's this user's turn to respond
        if (offer.status === 'pending_seller' && userId !== offer.seller_id) {
            return res.status(403).json({ message: 'Forbidden: It is the seller\'s turn to respond.' });
        }
        
        if (offer.status === 'pending_buyer' && userId !== offer.buyer_id) {
            return res.status(403).json({ message: 'Forbidden: It is the buyer\'s turn to respond.' });
        }
        
        if (offer.status === 'accepted' || offer.status === 'rejected') {
             return res.status(400).json({ message: 'This offer is already closed.' });
        }

        let updatedOffer;
        let notificationMessage = '';
        let notificationRecipientId;

        // 3. Handle the response logic
        if (responseType === 'accept') {
            const updateOfferQuery = `UPDATE offers SET status = 'accepted', updated_at = NOW() WHERE offer_id = $1 RETURNING *`;
            updatedOffer = (await client.query(updateOfferQuery, [offerId])).rows[0];

            await client.query(`UPDATE listings SET status = 'sold' WHERE listing_id = $1`, [offer.listing_id]);
            await client.query(`UPDATE offers SET status = 'rejected' WHERE listing_id = $1 AND offer_id != $2 AND status LIKE 'pending_%'`, [offer.listing_id, offerId]);

            notificationRecipientId = (userId === offer.seller_id) ? offer.buyer_id : offer.seller_id;
            notificationMessage = `Your offer for "${listingName}" has been accepted!`;

        } else if (responseType === 'reject') {
            const updateOfferQuery = `UPDATE offers SET status = 'rejected', updated_at = NOW() WHERE offer_id = $1 RETURNING *`;
            updatedOffer = (await client.query(updateOfferQuery, [offerId])).rows[0];

            notificationRecipientId = (userId === offer.seller_id) ? offer.buyer_id : offer.seller_id;
            notificationMessage = `Your offer for "${listingName}" was rejected.`;
        
        } else if (responseType === 'counter') {
            if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
                return res.status(400).json({ message: 'A valid new price is required for a counter-offer.' });
            }

            const newStatus = (offer.status === 'pending_seller') ? 'pending_buyer' : 'pending_seller';
            
            const updateOfferQuery = `
                UPDATE offers 
                SET status = $1, offer_price = $2, updated_at = NOW() 
                WHERE offer_id = $3 RETURNING *
            `;
            updatedOffer = (await client.query(updateOfferQuery, [newStatus, newPrice, offerId])).rows[0];

            notificationRecipientId = (userId === offer.seller_id) ? offer.buyer_id : offer.seller_id;
            const counterOfferName = (userId === offer.seller_id) ? offer.seller_name : offer.buyer_name;
            notificationMessage = `${counterOfferName} sent you a counter-offer of ₹${newPrice} for "${listingName}".`;

        } else {
            return res.status(400).json({ message: 'Invalid response type.' });
        }

        // 4. Send notification and socket event
        const linkUrl = `/offers`;
        const newNotification = await createNotification(client, notificationRecipientId, notificationMessage, linkUrl);
        
        if (req.io) {
            req.io.to(notificationRecipientId.toString()).emit('offer_update', { offer: updatedOffer });
            req.io.to(notificationRecipientId.toString()).emit('new_notification', newNotification);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Response submitted successfully.', offer: updatedOffer });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in respondToOffer:", error);
        next(error);
    } finally {
        client.release();
    }
};