const db = require('../db');

/**
 * HELPER: Format Data for Frontend
 */
const formatDemand = (demand) => {
    if (!demand) return null;
    let extra = {}; 
    try {
        extra = JSON.parse(demand.description) || {};
    } catch (e) {
        extra = { note: demand.description || '' };
    }
    
    return {
        ...demand,
        demand_id: demand.demand_id,
        trader_id: demand.user_id, 
        diamond_details: {
            size: demand.min_carat || 0,
            carat: demand.min_carat,
            shape: demand.shape || 'Round',
            color: demand.color || 'Any',
            clarity: demand.clarity || 'Any',
            price_per_caret: parseFloat(demand.max_price) || 0,
            quantity: extra.quantity || 1, 
            payment_duration: extra.payment_duration || 'N/A',
            require_till: extra.require_till || 'N/A',
            note: extra.note || ''
        },
        traderProfile: {
            user_id: demand.user_id,
            full_name: demand.full_name || 'Diamond Trader',
            office_name: demand.office_name || 'Registered Office',
            profile_photo_url: demand.profile_photo_url || null
        },
        status: demand.status,
        interest_count: parseInt(demand.interest_count) || 0
    };
};

// --- 1. POST NEW DEMAND ---
exports.createDemand = async (req, res, next) => {
    const { size, clarity, price_per_caret, quantity, private_name, require_till, payment_duration, shape, color, description, diamond_type } = req.body;
    try {
        const extraInfo = JSON.stringify({
            quantity: quantity || 1,
            payment_duration: payment_duration || 'N/A',
            private_name: private_name || 'N/A',
            require_till: require_till || 'N/A',
            note: description || ''
        });

        const query = `
            INSERT INTO demands 
            (user_id, shape, min_carat, max_carat, color, clarity, min_price, max_price, description, status, diamond_type) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10) 
            RETURNING *
        `;
        const values = [
            req.user.user_id, 
            shape || 'Round', 
            parseFloat(size) || 0, 
            parseFloat(size) || 0, 
            color || 'Any', 
            clarity || 'Any', 
            0, 
            parseFloat(price_per_caret) || 0, 
            extraInfo,
            diamond_type || 'Natural'
        ];
        
        const { rows } = await db.query(query, values);
        res.status(201).json({ message: 'Demand posted!', demand: formatDemand(rows[0]) });
    } catch (error) { next(error); }
};

// --- 2. GET FEED (Fixed: Removed missing column check) ---
exports.getAllDemands = async (req, res, next) => {
    try {
        // 🛑 REMOVED 'dealing_in' check to prevent crash
        const query = `
            SELECT d.*, u.full_name, u.office_name, u.profile_photo_url,
            (SELECT COUNT(*) FROM demand_interests di WHERE di.demand_id = d.demand_id) AS interest_count 
            FROM demands d 
            JOIN users u ON d.user_id = u.user_id
            WHERE d.status = 'active'
            ORDER BY d.created_at DESC
        `;
        
        const { rows } = await db.query(query);
        res.status(200).json(rows.map(formatDemand));
    } catch (error) { next(error); }
};

// --- 3. GET SINGLE DEMAND ---
exports.getDemandById = async (req, res, next) => {
    try {
        const query = `
            SELECT d.*, u.full_name, u.office_name, u.profile_photo_url
            FROM demands d 
            JOIN users u ON d.user_id = u.user_id 
            WHERE d.demand_id = $1
        `;
        const { rows } = await db.query(query, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });

        const interestCheck = await db.query(
            `SELECT 1 FROM demand_interests WHERE demand_id = $1 AND broker_id = $2`,
            [req.params.id, req.user.user_id]
        );

        const formatted = formatDemand(rows[0]);
        formatted.isInterested = interestCheck.rows.length > 0;
        
        res.status(200).json(formatted);
    } catch (error) { next(error); }
};

// --- 4. REQUEST MORE DETAILS (Renamed & Fixed) ---
exports.requestMoreDetails = async (req, res, next) => {
    const { demandId } = req.params;
    const brokerId = req.user.user_id;

    try {
        // 1. Get Demand Info
        const demandQuery = `
            SELECT d.*, u.user_id as trader_id, u.office_name
            FROM demands d
            JOIN users u ON d.user_id = u.user_id
            WHERE d.demand_id = $1
        `;
        const { rows } = await db.query(demandQuery, [demandId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Demand not found' });

        const demand = rows[0];
        const traderId = demand.trader_id;

        // 2. Find or Create Chat
        let conversationId;
        const convQuery = `
            SELECT conversation_id FROM conversations 
            WHERE (participant1_id = $1 AND participant2_id = $2) 
               OR (participant1_id = $2 AND participant2_id = $1)
        `;
        const convResult = await db.query(convQuery, [brokerId, traderId]);

        if (convResult.rows.length > 0) {
            conversationId = convResult.rows[0].conversation_id;
        } else {
            const newConv = await db.query(
                `INSERT INTO conversations (participant1_id, participant2_id) VALUES ($1, $2) RETURNING conversation_id`,
                [brokerId, traderId]
            );
            conversationId = newConv.rows[0].conversation_id;
        }

        // 3. PROFESSIONAL MESSAGE (No "Bot" Name)
        const messageContent = `
📄 *Demand Details Request*
I am interested in Demand #${demandId}.

Specs:
• ${demand.min_carat}ct ${demand.shape}
• Color: ${demand.color}, Clarity: ${demand.clarity}

Please share more information.
        `.trim();

        await db.query(
            `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)`,
            [conversationId, brokerId, messageContent] // Sent by BROKER (You), not the Trader
        );

        res.status(200).json({ message: 'Request sent successfully!', conversation_id: conversationId });
    } catch (error) { 
        console.error("Request Details Error:", error);
        next(error); 
    }
};

// --- 5. RAISE HAND ---
exports.raiseHand = async (req, res, next) => {
    try {
        await db.query(`INSERT INTO demand_interests (demand_id, broker_id, status) VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING`, [req.params.demandId, req.user.user_id]);
        res.status(200).json({ message: 'Hand raised!' });
    } catch (error) { next(error); }
};

// --- 6. MY INTERESTS ---
exports.getMyInterests = async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT d.* FROM demand_interests di JOIN demands d ON di.demand_id = d.demand_id WHERE di.broker_id = $1 ORDER BY di.created_at DESC`, [req.user.user_id]);
        res.status(200).json(rows.map(formatDemand));
    } catch (error) { next(error); }
};

// --- 7. UTILS ---
exports.deleteDemand = async (req, res, next) => {
    try {
        await db.query('DELETE FROM demands WHERE demand_id = $1 AND user_id = $2', [req.params.id, req.user.user_id]);
        res.status(200).json({ message: 'Deleted' });
    } catch (error) { next(error); }
};

exports.hireBroker = async (req, res, next) => {
    const { demandId, brokerId } = req.body;
    try {
        await db.query(`UPDATE demands SET status = 'on_memo', hired_broker_id = $1 WHERE demand_id = $2`, [brokerId, demandId]);
        res.status(200).json({ message: 'Broker hired' });
    } catch (error) { next(error); }
};

exports.markCompleted = async (req, res, next) => {
    const { final_price, final_weight } = req.body;
    try {
        await db.query(`UPDATE demands SET status = 'completed', final_price = $1, final_weight = $2 WHERE demand_id = $3`, [final_price, final_weight, req.params.demandId]);
        res.status(200).json({ message: 'Completed' });
    } catch (error) { next(error); }
};

exports.getMyDemands = async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT d.*, (SELECT COUNT(*) FROM demand_interests di WHERE di.demand_id = d.demand_id) AS interest_count FROM demands d WHERE d.user_id = $1 ORDER BY d.created_at DESC`, [req.user.user_id]);
        res.status(200).json(rows.map(formatDemand));
    } catch (error) { next(error); }
};

// --- 8. STUBS ---
exports.getPendingInterests = async (req, res, next) => { res.json([]); };
exports.getHiredDemands = async (req, res, next) => { res.json([]); };
exports.dismissBrokerInterest = async (req, res, next) => { res.json({ message: 'Dismissed' }); };
exports.unhireBroker = async (req, res, next) => { res.json({ message: 'Unhired' }); };
exports.getBrokerReviews = async (req, res, next) => { res.json([]); };
exports.returnItem = async (req, res, next) => { res.json({ message: 'Returned' }); };

module.exports = exports;