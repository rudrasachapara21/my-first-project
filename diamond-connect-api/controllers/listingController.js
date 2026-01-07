const db = require('../db');
const { createNotification } = require('../services/notificationService');
const axios = require('axios'); 
const FormData = require('form-data'); // ⚠️ REQUIRED: Make sure to run 'npm install form-data'

// --- Helper: Format Listing ---
const formatListing = (listing) => {
    if (!listing) return null;
    return {
        ...listing,
        diamond_details: {
            carat: listing.carat || (listing.diamond_details ? listing.diamond_details.carat : null),
            shape: listing.shape || (listing.diamond_details ? listing.diamond_details.shape : null),
            color: listing.color || (listing.diamond_details ? listing.diamond_details.color : null),
            clarity: listing.clarity || (listing.diamond_details ? listing.diamond_details.clarity : null),
            cut: listing.cut || (listing.diamond_details ? listing.diamond_details.cut : null),
            price: listing.price
        }
    };
};

// --- NEW: Analyze PDF via Python ---
// This function takes the file from memory and passes it to the Python AI Service
exports.analyzePdf = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    // 1. Check Configuration
    const aiServiceUrl = process.env.AI_SERVICE_URL;
    if (!aiServiceUrl) {
        console.error("❌ AI_SERVICE_URL is not set in environment variables.");
        return res.status(500).json({ message: "AI Service not configured." });
    }

    try {
        console.log("📄 PDF received. Sending to Python for analysis...");

        // 2. Prepare form data
        const form = new FormData();
        form.append('file', req.file.buffer, req.file.originalname);

        // 3. Send to Python Service (Using the Environment Variable)
        // We remove any trailing slash from the env var just in case, then append /analyze-pdf
        const targetUrl = `${aiServiceUrl.replace(/\/$/, "")}/analyze-pdf`;
        console.log(`🔗 Connecting to AI Service at: ${targetUrl}`);
        
        const response = await axios.post(targetUrl, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log("✅ Analysis complete:", response.data);
        res.status(200).json(response.data);

    } catch (error) {
        console.error("❌ Python Analysis Error:", error.message);
        // Handle connection errors specifically
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ message: "AI Service is currently unavailable." });
        }
        res.status(500).json({ message: "AI Analysis failed." });
    }
};

// 1. Create Listing
exports.createListing = async (req, res, next) => {
    let { 
        title, description, price, 
        shape, carat, color, clarity, cut, 
        reportNumber, 
        diamond_details 
    } = req.body;
    
    const userId = req.user.user_id;

    let finalImageUrls = [];
    let finalCertificateUrl = null;

    if (req.files) {
        if (req.files['listingImages']) {
            finalImageUrls = req.files['listingImages'].map(file => file.path || file.location);
        }
        if (req.files['certificateFile']) {
            finalCertificateUrl = req.files['certificateFile'][0].path || req.files['certificateFile'][0].location;
        }
    }

    // Data Extraction Fallback
    if (!shape && diamond_details?.shape) shape = diamond_details.shape;
    if (!carat && diamond_details?.carat) carat = diamond_details.carat;
    if (!color && diamond_details?.color) color = diamond_details.color;
    if (!clarity && diamond_details?.clarity) clarity = diamond_details.clarity;
    if (!cut && diamond_details?.cut) cut = diamond_details.cut;
    if (!price && diamond_details?.price) price = diamond_details.price;

    if (!title && shape && carat) {
        title = `${carat}ct ${shape} Diamond`;
    }

    try {
        const query = `
            INSERT INTO listings (
                user_id, title, description, price, shape, carat, color, clarity, cut, 
                certificate_url, certificate_number, image_urls, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
            RETURNING *
        `;
        const values = [
            userId, title, description, price, 
            shape, carat, color, clarity, cut, 
            finalCertificateUrl, reportNumber, finalImageUrls
        ];

        const { rows } = await db.query(query, values);
        res.status(201).json(formatListing(rows[0]));
    } catch (error) {
        next(error);
    }
};

// 2. Get All (Active)
exports.getAllListings = async (req, res, next) => {
    try {
        const query = `
            SELECT l.*, u.full_name, u.office_name, u.profile_photo_url 
            FROM listings l
            JOIN users u ON l.user_id = u.user_id
            WHERE l.status = 'active'
            ORDER BY l.created_at DESC
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows.map(formatListing));
    } catch (error) {
        next(error);
    }
};

// 3. Get My Listings
exports.getMyListings = async (req, res, next) => {
    const userId = req.user.user_id;
    try {
        const query = `
            SELECT * FROM listings 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows.map(formatListing));
    } catch (error) {
        next(error);
    }
};

// 4. Get By ID
exports.getListingById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT l.*, u.full_name, u.office_name, u.office_address, u.phone_number, u.gst_number, u.profile_photo_url
            FROM listings l
            JOIN users u ON l.user_id = u.user_id
            WHERE l.listing_id = $1
        `;
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Listing not found' });
        
        res.status(200).json(formatListing(rows[0]));
    } catch (error) {
        next(error);
    }
};

// 5. Update
exports.updateListing = async (req, res, next) => {
    const { id } = req.params;
    const { price, description, status } = req.body;
    const userId = req.user.user_id;

    try {
        const ownerCheck = await db.query('SELECT user_id FROM listings WHERE listing_id = $1', [id]);
        if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].user_id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You do not own this listing.' });
        }

        const updateQuery = `
            UPDATE listings 
            SET price = COALESCE($1, price), 
                description = COALESCE($2, description), 
                status = COALESCE($3, status)
            WHERE listing_id = $4 AND user_id = $5
            RETURNING *
        `;
        const { rows } = await db.query(updateQuery, [price, description, status, id, userId]);

        res.status(200).json({ message: 'Listing updated successfully!', listing: rows[0] });
    } catch (error) {
        next(error);
    }
};

// 6. Delete
exports.deleteListing = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.user_id;
    try {
        const query = 'DELETE FROM listings WHERE listing_id = $1 AND user_id = $2 RETURNING listing_id';
        const { rows } = await db.query(query, [id, userId]);
        
        if (rows.length === 0) return res.status(403).json({ message: 'Forbidden or Not Found' });
        
        if (req.io) req.io.emit('listing-deleted', { listingId: id });
        
        res.status(200).json({ message: 'Listing deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// 7. Toggle Interest
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
            
            const sellerQuery = 'SELECT user_id FROM listings WHERE listing_id = $1';
            const { rows: listingRows } = await db.query(sellerQuery, [listingId]);
            if (listingRows.length > 0 && req.io) {
                req.io.emit('listing-interest-received', { listingId, interestedUserId, sellerId: listingRows[0].user_id });
            }
            res.status(201).json({ message: 'Interest registered successfully' });
        }
    } catch (error) {
        next(error);
    }
};

// 8. Get Offers
exports.getListingOffers = async (req, res, next) => {
    const { listingId } = req.params;
    const userId = req.user.user_id;

    try {
        const ownerCheck = await db.query('SELECT user_id FROM listings WHERE listing_id = $1', [listingId]);
        if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].user_id !== userId) {
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

// 9. Mark Sold
exports.markSold = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    console.log(`🔍 Attempting Mark Sold: Listing ${id} by User ${userId}`);

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Verify Ownership
        const listingCheck = await client.query(
            'SELECT * FROM listings WHERE listing_id = $1 AND user_id = $2',
            [id, userId]
        );
        
        if (listingCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: "Forbidden." });
        }

        const listing = listingCheck.rows[0];

        // Find Accepted Offer
        const offerCheck = await client.query(
            `SELECT o.buyer_id, o.offer_price 
             FROM offers o 
             WHERE o.listing_id = $1 AND o.status = 'accepted' 
             LIMIT 1`,
            [id]
        );

        let finalPrice = listing.price;
        let buyerId = null;

        if (offerCheck.rows.length > 0) {
            finalPrice = offerCheck.rows[0].offer_price;
            buyerId = offerCheck.rows[0].buyer_id;
        }

        // Update Status
        await client.query(
            `UPDATE listings 
             SET status = 'sold', sold_at = NOW(), final_price = $1, buyer_id = $2
             WHERE listing_id = $3`,
            [finalPrice, buyerId, id]
        );

        // Clean up offers
        await client.query(
            `UPDATE offers SET status = 'rejected' WHERE listing_id = $1 AND status != 'accepted'`,
            [id]
        );
        
        // Notify Buyer
        if (buyerId) {
             const message = `Deal Completed! The listing for ${listing.shape} ${listing.carat}ct has been marked as sold to you.`;
             const linkUrl = `/buy-feed`; 
             const newNotification = await createNotification(client, buyerId, message, linkUrl);
             if (req.io) req.io.to(buyerId.toString()).emit('new_notification', newNotification);
        }

        await client.query('COMMIT');
        res.json({ message: "Listing marked as SOLD!" });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

// 10. Reactivate
exports.reactivateListing = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE listings 
             SET status = 'active', sold_at = NULL, final_price = NULL, buyer_id = NULL
             WHERE listing_id = $1 AND user_id = $2
             RETURNING listing_id`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: "Forbidden." });
        }

        await client.query(
            `UPDATE offers SET status = 'rejected' WHERE listing_id = $1`,
            [id]
        );

        await client.query('COMMIT');
        res.json({ message: "Listing is ACTIVE again." });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

// 11. Fetch Certificate Data (Legacy / Manual)
exports.fetchCertificateData = async (req, res, next) => {
    const { reportNumber } = req.body;

    if (!reportNumber) {
        return res.status(400).json({ message: "Report Number is required" });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL;
    if (!aiServiceUrl) {
        return res.status(500).json({ message: "AI Service not configured." });
    }

    try {
        // Use environment variable and append route
        const pythonServiceUrl = `${aiServiceUrl.replace(/\/$/, "")}/fetch-certificate`;
        
        const response = await axios.post(pythonServiceUrl, {
            report_number: reportNumber
        });

        res.status(200).json(response.data);

    } catch (error) {
        console.error("❌ Python Service Error:", error.message);
        res.status(500).json({ 
            message: "Could not fetch certificate data." 
        });
    }
};