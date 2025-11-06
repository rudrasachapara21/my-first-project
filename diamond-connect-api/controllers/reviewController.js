const db = require('../db');
const { createNotification } = require('../services/notificationService');

exports.createReview = async (req, res, next) => {
    // ## CHANGE: Now accepts 'offer_id' OR 'demand_id' ##
    const { offer_id, demand_id, reviewee_id, rating, review_text } = req.body;
    const reviewer_id = req.user.user_id;

    // 1. Validation
    if (!reviewee_id || !rating) {
        return res.status(400).json({ message: 'Reviewee ID and rating are required.' });
    }
    if (!offer_id && !demand_id) {
         return res.status(400).json({ message: 'A valid offer_id or demand_id is required to leave a review.' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 2. Check for duplicate review
        let existingReviewQuery;
        let queryParams;

        if (offer_id) {
            existingReviewQuery = 'SELECT review_id FROM reviews WHERE offer_id = $1 AND reviewer_id = $2';
            queryParams = [offer_id, reviewer_id];
        } else { // must be demand_id
            existingReviewQuery = 'SELECT review_id FROM reviews WHERE demand_id = $1 AND reviewer_id = $2';
            queryParams = [demand_id, reviewer_id];
        }
        
        const existingReview = await client.query(existingReviewQuery, queryParams);

        if (existingReview.rows.length > 0) {
            return res.status(409).json({ message: 'You have already submitted a review for this deal.' });
        }

        // 3. Insert the new review
        const reviewQuery = `
            INSERT INTO reviews (reviewer_id, reviewee_id, rating, review_text, offer_id, demand_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        // Use null if the value isn't provided
        const reviewValues = [reviewer_id, reviewee_id, rating, review_text, offer_id || null, demand_id || null];
        
        const { rows } = await client.query(reviewQuery, reviewValues);
        const newReview = rows[0];

        // 4. Notification logic (this is unchanged and works perfectly)
        const reviewerName = req.user.full_name;
        const message = `${reviewerName} left you a ${rating}-star review!`;
        const linkUrl = `/profile/${reviewee_id}`;
        
        const newNotification = await createNotification(client, reviewee_id, message, linkUrl);
        
        if (req.io) {
            req.io.to(reviewee_id.toString()).emit('new_notification', newNotification);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Review submitted successfully!', review: newReview });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating review:', error);
        next(error);
    } finally {
        client.release();
    }
};