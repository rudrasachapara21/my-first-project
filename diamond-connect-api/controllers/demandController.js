const db = require('../db');
const { createNotification } = require('../services/notificationService');

// --- HELPER: Format Data for Frontend ---
const formatDemand = (demand) => {
    if (!demand) return null;
    let desc = demand.description;
    
    return {
        ...demand,
        trader_id: demand.user_id, 
        diamond_details: {
            size: demand.min_carat || demand.size || 0,
            carat: demand.min_carat,
            shape: demand.shape || 'Round',
            color: demand.color || 'Any',
            clarity: demand.clarity || 'Any',
            price_per_caret: demand.max_price || 0,
            quantity: 1, 
            payment_duration: desc && desc.includes('Payment:') ? desc.split('Payment:')[1].split(',')[0].trim() : 'N/A',
            note: desc
        },
        final_price: demand.final_price,
        final_weight: demand.final_weight,
        broker_review: demand.broker_review,
        status: demand.status,
        hired_broker_id: demand.hired_broker_id,
        isInterested: false 
    };
};

// --- CORE DEMAND CRUD ---

exports.createDemand = async (req, res, next) => {
    const { 
        size, clarity, price_per_caret, quantity, private_name, 
        require_till, payment_duration,
        shape, min_carat, max_carat, color, min_price, max_price, description 
    } = req.body;
    
    const userId = req.user.user_id;
    const finalMinCarat = min_carat || size;
    const finalMaxCarat = max_carat || size;
    const finalMinPrice = min_price || 0;
    const finalMaxPrice = max_price || price_per_caret;
    const finalShape = shape || 'Round'; 
    
    if (!finalMinCarat || !finalMaxPrice) {
        return res.status(400).json({ message: 'Size (Carat) and Price are required.' });
    }

    try {
        const extraInfo = description || `Quantity: ${quantity || 1}, Payment: ${payment_duration || 'N/A'}, Name: ${private_name || 'N/A'}`;
        
        const query = `
            INSERT INTO demands (user_id, shape, min_carat, max_carat, color, clarity, min_price, max_price, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *
        `;
        const values = [
            userId, finalShape, finalMinCarat, finalMaxCarat, 
            color || 'Any', clarity || 'Any', finalMinPrice, finalMaxPrice, extraInfo
        ];
        
        const { rows } = await db.query(query, values);
        const newDemand = formatDemand(rows[0]);

        req.io.emit('new-demand', newDemand);
        res.status(201).json({ message: 'Demand posted successfully!', demand: newDemand });
    } catch (error) {
        next(error);
    }
};

exports.getAllDemands = async (req, res, next) => {
    try {
        const query = `
            SELECT d.*, 
            (SELECT COUNT(*) FROM demand_interests di WHERE di.demand_id = d.demand_id) AS interest_count 
            FROM demands d 
            WHERE d.status = 'active' 
            ORDER BY d.created_at DESC
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows.map(formatDemand));
    } catch (error) {
        next(error);
    }
};

exports.getMyDemands = async (req, res, next) => {
    const userId = req.user.user_id;
    try {
        const query = `
            SELECT d.*, 
            (SELECT COUNT(*) FROM demand_interests di WHERE di.demand_id = d.demand_id) AS interest_count 
            FROM demands d 
            WHERE d.user_id = $1 
            ORDER BY d.created_at DESC
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows.map(formatDemand));
    } catch (error) {
        next(error);
    }
};

exports.getDemandById = async (req, res, next) => {
    const { id } = req.params;
    const requesterId = req.user.user_id;
    const requesterRole = req.user.role;

    try {
        const demandQuery = `
            SELECT d.*, t.full_name as trader_full_name, t.office_name as trader_office_name, 
            t.phone_number as trader_phone_number, t.profile_photo_url as trader_profile_photo_url 
            FROM demands d 
            JOIN users t ON d.user_id = t.user_id 
            WHERE d.demand_id = $1
        `;
        const { rows } = await db.query(demandQuery, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Demand not found' });

        let demandData = formatDemand(rows[0]);
        
        const response = {
            ...demandData,
            traderProfile: {
                user_id: demandData.user_id,
                full_name: demandData.trader_full_name,
                office_name: demandData.trader_office_name,
                phone_number: demandData.trader_phone_number,
                profile_photo_url: demandData.trader_profile_photo_url,
            }
        };

        const isOwner = String(response.user_id) === String(requesterId);

        if (isOwner) {
            const interestQuery = `
                SELECT u.user_id, u.full_name, u.profile_photo_url, u.office_name, u.reputation_points, di.status as interest_status
                FROM demand_interests di 
                JOIN users u ON di.broker_id = u.user_id 
                WHERE di.demand_id = $1
            `;
            const interestRes = await db.query(interestQuery, [id]);
            response.interested_brokers = interestRes.rows;
        }

        if (requesterRole === 'broker') {
            const interestCheckQuery = 'SELECT status FROM demand_interests WHERE demand_id = $1 AND broker_id = $2';
            const interestCheck = await db.query(interestCheckQuery, [id, requesterId]);
            response.isInterested = interestCheck.rowCount > 0;
            response.myInterestStatus = interestCheck.rowCount > 0 ? interestCheck.rows[0].status : null;
        }

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

exports.deleteDemand = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.user_id;
    try {
        const query = 'DELETE FROM demands WHERE demand_id = $1 AND user_id = $2 RETURNING demand_id';
        const { rows } = await db.query(query, [id, userId]);
        if (rows.length === 0) return res.status(403).json({ message: 'Forbidden' });
        
        req.io.emit('demand-deleted', { demandId: id });
        res.status(200).json({ message: 'Demand deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

// --- NEW WORKFLOW: BROKER HAND RAISE ---

exports.raiseHand = async (req, res, next) => {
    const { demandId } = req.params;
    const brokerId = req.user.user_id;
    const brokerName = req.user.full_name;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const check = await client.query(
            `SELECT * FROM demand_interests WHERE demand_id = $1 AND broker_id = $2`,
            [demandId, brokerId]
        );

        if (check.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: "Hand already raised!" });
        }

        await client.query(
            `INSERT INTO demand_interests (demand_id, broker_id, status) VALUES ($1, $2, 'pending')`,
            [demandId, brokerId]
        );

        const demandQuery = 'SELECT user_id, shape, min_carat, max_carat FROM demands WHERE demand_id = $1';
        const { rows: demandRows } = await client.query(demandQuery, [demandId]);
        
        if (demandRows.length > 0) {
            const traderId = demandRows[0].user_id;
            const demandTitle = `${demandRows[0].shape} (${demandRows[0].min_carat}ct)`;
            
            req.io.emit('interest-received', { demandId, brokerId, traderId });
            
            const message = `${brokerName} raised a hand for: "${demandTitle}"`;
            const linkUrl = `/demand/${demandId}`;
            const newNotification = await createNotification(client, traderId, message, linkUrl);
            
            req.io.to(traderId.toString()).emit('new_notification', newNotification);
        }

        await client.query('COMMIT');
        res.json({ message: "Hand raised successfully! Seller notified." });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// --- NEW WORKFLOW: HIRE BROKER (MEMO) ---

exports.hireBroker = async (req, res, next) => {
    const demandId = req.body.demandId || req.params.demandId;
    const brokerId = req.body.brokerId || req.params.brokerId;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        await client.query(`
            UPDATE demands 
            SET status = 'on_memo', hired_broker_id = $1, is_on_memo = TRUE 
            WHERE demand_id = $2
        `, [brokerId, demandId]);

        await client.query(`
            UPDATE demand_interests 
            SET status = 'accepted' 
            WHERE demand_id = $1 AND broker_id = $2
        `, [demandId, brokerId]);

        const demandCheck = await client.query('SELECT shape FROM demands WHERE demand_id = $1', [demandId]);
        const demandTitle = demandCheck.rows[0]?.shape || "Diamond Demand";

        const message = `You have been hired (On Memo) for the demand: "${demandTitle}".`;
        const linkUrl = `/broker/demand/${demandId}`;
        const newNotification = await createNotification(client, brokerId, message, linkUrl);
        
        req.io.to(brokerId.toString()).emit('new_notification', newNotification);

        await client.query('COMMIT');
        res.json({ message: "Broker hired! Item is now ON MEMO." });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// --- NEW WORKFLOW: MARK COMPLETED (DETAIL FORM) ---

exports.markCompleted = async (req, res, next) => {
    const { demandId } = req.params;
    const { final_price, final_weight, broker_review } = req.body;
    const userId = req.user.user_id; 

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(`
            UPDATE demands 
            SET status = 'completed', 
                final_price = $1, 
                final_weight = $2, 
                broker_review = $3, 
                completed_at = NOW(),
                is_on_memo = FALSE
            WHERE demand_id = $4 AND user_id = $5
            RETURNING hired_broker_id
        `, [final_price || 0, final_weight || 0, broker_review || '', demandId, userId]);
        
        const brokerId = result.rows[0]?.hired_broker_id;

        if (brokerId) {
            await client.query(`
                UPDATE users SET reputation_points = COALESCE(reputation_points, 0) + 1 WHERE user_id = $1
            `, [brokerId]);

            const message = `Deal Completed! You earned a reputation point. Review: "${broker_review}"`;
            const linkUrl = `/profile/${brokerId}`;
            const newNotification = await createNotification(client, brokerId, message, linkUrl);
            req.io.to(brokerId.toString()).emit('new_notification', newNotification);
        }

        req.io.emit('demand-completed', { demandId: parseInt(demandId) });

        await client.query('COMMIT');
        res.json({ message: "Deal Closed! Details saved to Statement." });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

exports.returnItem = async (req, res, next) => {
    const { demandId } = req.params;
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        const check = await client.query('SELECT hired_broker_id FROM demands WHERE demand_id = $1', [demandId]);
        const brokerId = check.rows[0]?.hired_broker_id;

        await client.query(`
            UPDATE demands 
            SET status = 'active', 
                hired_broker_id = NULL, 
                is_on_memo = FALSE 
            WHERE demand_id = $1
        `, [demandId]);

        if (brokerId) {
            const message = `The item has been returned/un-hired. The demand #${demandId} is open again.`;
            const linkUrl = `/demand/${demandId}`;
            const newNotification = await createNotification(client, brokerId, message, linkUrl);
            req.io.to(brokerId.toString()).emit('new_notification', newNotification);
        }

        await client.query('COMMIT');
        res.json({ message: "Item returned. Now visible to other brokers." });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// --- RICH MESSAGE REQUEST DETAILS ---

exports.requestMoreDetails = async (req, res, next) => {
    const { id: demandId } = req.params;
    const { user_id: brokerId } = req.user;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Fetch Demand AND Trader Details
        const demandQuery = `
            SELECT d.*, u.full_name, u.office_address, u.office_hours, u.reputation_points
            FROM demands d
            JOIN users u ON d.user_id = u.user_id
            WHERE d.demand_id = $1
        `;
        const { rows: demandRows } = await client.query(demandQuery, [demandId]);
        
        if (demandRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Demand not found.' });
        }
        
        const demand = demandRows[0];
        const traderId = demand.user_id;

        // 2. Construct the RICH MESSAGE
        const messageBody = `Hello! Here are the full details for the demand you requested.

--- Diamond Details ---
Size: ${demand.min_carat}-${demand.max_carat}ct
Clarity: ${demand.clarity}
Shape: ${demand.shape}
Color: ${demand.color}
Budget: ₹${demand.min_price} - ₹${demand.max_price}
Notes: ${demand.description || 'N/A'}

--- Trader Information ---
Office Address: ${demand.office_address || 'N/A'}
Office Hours: ${demand.office_hours || 'N/A'}
Reputation: ${demand.reputation_points || 0} Points

Feel free to reply here with any further questions.`;
        
        // 3. Find or Create Conversation
        let conversationId;
        const findConv = await client.query(`
            SELECT conversation_id FROM conversation_participants 
            WHERE conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = $1)
            AND user_id = $2
        `, [brokerId, traderId]);

        if (findConv.rows.length > 0) {
            conversationId = findConv.rows[0].conversation_id;
        } else {
            const newConv = await client.query('INSERT INTO conversations DEFAULT VALUES RETURNING conversation_id');
            conversationId = newConv.rows[0].conversation_id;
            await client.query('INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)', [conversationId, brokerId, traderId]);
        }
        
        // 4. Send Message
        const newMsg = await client.query(`
            INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *
        `, [conversationId, traderId, messageBody]);

        req.io.to(brokerId.toString()).emit('new_message', newMsg.rows[0]);
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Details have been sent to your chat.' });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

exports.dismissBrokerInterest = async (req, res, next) => { 
    const { demandId, brokerId } = req.params; 
    try { 
        await db.query('DELETE FROM demand_interests WHERE demand_id = $1 AND broker_id = $2', [demandId, brokerId]); 
        res.status(200).json({ message: 'Interest dismissed.' }); 
    } catch (error) { 
        next(error); 
    } 
};

exports.unhireBroker = async (req, res, next) => { 
    return exports.returnItem(req, res, next);
};

exports.toggleInterest = async (req, res, next) => {
    return exports.raiseHand(req, res, next);
};

exports.getMyInterests = async (req, res, next) => {
    const brokerId = req.user.user_id;
    try {
        const query = 'SELECT demand_id FROM demand_interests WHERE broker_id = $1';
        const { rows } = await db.query(query, [brokerId]);
        res.status(200).json(rows.map(row => row.demand_id));
    } catch (error) {
        next(error);
    }
};

exports.getHiredDemands = async (req, res, next) => { 
    const brokerId = req.user.user_id; 
    try { 
        const query = ` 
            SELECT d.*, u.full_name as trader_name 
            FROM demands d 
            JOIN users u ON d.user_id = u.user_id 
            WHERE d.hired_broker_id = $1 ORDER BY d.created_at DESC 
        `; 
        const { rows } = await db.query(query, [brokerId]); 
        res.status(200).json(rows.map(formatDemand)); 
    } catch (error) { 
        next(error); 
    } 
};

exports.getPendingInterests = async (req, res, next) => { 
    const brokerId = req.user.user_id; 
    try { 
        const query = ` 
            SELECT d.*, u.full_name as trader_name 
            FROM demands d 
            JOIN users u ON d.user_id = u.user_id 
            WHERE d.demand_id IN ( SELECT di.demand_id FROM demand_interests di WHERE di.broker_id = $1 ) 
            AND d.status = 'active' 
            AND (d.hired_broker_id IS NULL OR d.hired_broker_id != $1) 
        `; 
        const { rows } = await db.query(query, [brokerId]); 
        res.status(200).json(rows.map(formatDemand)); 
    } catch (error) { 
        next(error); 
    } 
};

exports.completeDemand = async (req, res, next) => {
    return exports.markCompleted(req, res, next);
};

// --- NEW: GET PUBLIC REVIEWS FOR A BROKER ---
exports.getBrokerReviews = async (req, res, next) => {
    const { brokerId } = req.params;
    try {
        // Fetch completed demands where this broker was hired
        // We get review text, rating (if stored, otherwise defaults), and reviewer info
        const query = `
            SELECT d.completed_at, d.broker_review, d.shape, d.final_weight,
                   u.full_name as reviewer_name, u.profile_photo_url as reviewer_photo,
                   -- Assuming rating is stored in a separate reviews table or demand table.
                   -- If you have a 'reviews' table, JOIN it here. 
                   -- For now, using the demand's broker_review text.
                   5 as rating -- Placeholder if rating isn't in demands table
            FROM demands d
            JOIN users u ON d.user_id = u.user_id
            WHERE d.hired_broker_id = $1 
              AND d.status = 'completed' 
              AND d.broker_review IS NOT NULL
            ORDER BY d.completed_at DESC
        `;
        // NOTE: In a real app with a separate 'reviews' table, you would join that instead.
        // If you created a 'reviews' table in Step 2, replace this query to select from 'reviews'.
        
        // Let's assume you created a 'reviews' table as per previous instructions.
        const reviewsQuery = `
            SELECT r.*, u.full_name as reviewer_name, u.profile_photo_url as reviewer_photo,
                   d.shape, d.final_weight
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.user_id
            JOIN demands d ON r.demand_id = d.demand_id
            WHERE r.reviewee_id = $1
            ORDER BY r.created_at DESC
        `;
        
        const { rows } = await db.query(reviewsQuery, [brokerId]);
        
        // Calculate stats
        let totalRating = 0;
        rows.forEach(r => totalRating += parseFloat(r.rating || 0));
        const avgRating = rows.length > 0 ? (totalRating / rows.length).toFixed(1) : 0;

        res.status(200).json({
            stats: {
                average_rating: avgRating,
                total_reviews: rows.length
            },
            reviews: rows
        });
    } catch (error) {
        // Fallback if reviews table doesn't exist yet
        console.error("Error fetching reviews:", error);
        res.status(200).json({ stats: { average_rating: 0, total_reviews: 0 }, reviews: [] });
    }
};