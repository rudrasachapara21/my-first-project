const db = require('../db');
const { createNotification } = require('../services/notificationService');

/**
 * HELPER: Format Data for Frontend
 * Ensures the nested 'diamond_details' object exists even if the DB data is flat.
 */
const formatDemand = (demand) => {
    if (!demand) return null;
    let extra = {}; // Default to empty object
    try {
        // ✅ BUG FIX: Parse JSON instead of splitting strings
        extra = JSON.parse(demand.description) || {};
    } catch (e) {
        extra = { note: demand.description || '' };
    }
    
    return {
        ...demand,
        trader_id: demand.user_id, 
        diamond_details: {
            size: demand.min_carat || 0,
            carat: demand.min_carat,
            shape: demand.shape || 'Round',
            color: demand.color || 'Any',
            clarity: demand.clarity || 'Any',
            price_per_caret: demand.max_price || 0,
            quantity: extra.quantity || 1, 
            payment_duration: extra.payment_duration || 'N/A',
            require_till: extra.require_till || 'N/A',
            private_name: extra.private_name || 'N/A',
            note: extra.note || ''
        },
        status: demand.status,
        interest_count: parseInt(demand.interest_count) || 0
    };
};

exports.createDemand = async (req, res, next) => {
    const { size, clarity, price_per_caret, quantity, private_name, require_till, payment_duration, shape, color, description } = req.body;
    try {
        // ✅ BUG FIX: Store UI fields in a JSON blob
        const extraInfo = JSON.stringify({
            quantity: quantity || 1,
            payment_duration: payment_duration || 'N/A',
            private_name: private_name || 'N/A',
            require_till: require_till || 'N/A',
            note: description || ''
        });
        const query = `INSERT INTO demands (user_id, shape, min_carat, max_carat, color, clarity, min_price, max_price, description, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active') RETURNING *`;
        const values = [req.user.user_id, shape || 'Round', parseFloat(size) || 0, parseFloat(size) || 0, color || 'Any', clarity || 'Any', 0, parseFloat(price_per_caret) || 0, extraInfo];
        const { rows } = await db.query(query, values);
        res.status(201).json({ message: 'Demand posted!', demand: formatDemand(rows[0]) });
    } catch (error) { next(error); }
};

exports.getAllDemands = async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT d.*, (SELECT COUNT(*) FROM demand_interests di WHERE di.demand_id = d.demand_id) AS interest_count FROM demands d WHERE d.status = 'active' ORDER BY d.created_at DESC`);
        res.status(200).json(rows.map(formatDemand));
    } catch (error) { next(error); }
};

exports.getMyDemands = async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT d.*, (SELECT COUNT(*) FROM demand_interests di WHERE di.demand_id = d.demand_id) AS interest_count FROM demands d WHERE d.user_id = $1 ORDER BY d.created_at DESC`, [req.user.user_id]);
        res.status(200).json(rows.map(formatDemand));
    } catch (error) { next(error); }
};

exports.getDemandById = async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT d.*, u.full_name as trader_full_name FROM demands d JOIN users u ON d.user_id = u.user_id WHERE d.demand_id = $1`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.status(200).json(formatDemand(rows[0]));
    } catch (error) { next(error); }
};

exports.deleteDemand = async (req, res, next) => {
    try {
        await db.query('DELETE FROM demands WHERE demand_id = $1 AND user_id = $2', [req.params.id, req.user.user_id]);
        res.status(200).json({ message: 'Deleted' });
    } catch (error) { next(error); }
};

// --- WORKFLOW & INTERESTS ---
exports.raiseHand = async (req, res, next) => {
    try {
        await db.query(`INSERT INTO demand_interests (demand_id, broker_id, status) VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING`, [req.params.demandId, req.user.user_id]);
        res.status(200).json({ message: 'Hand raised!' });
    } catch (error) { next(error); }
};

exports.getMyInterests = async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT d.* FROM demand_interests di JOIN demands d ON di.demand_id = d.demand_id WHERE di.broker_id = $1`, [req.user.user_id]);
        res.status(200).json(rows.map(formatDemand));
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

exports.returnItem = async (req, res, next) => {
    try {
        await db.query(`UPDATE demands SET status = 'active', hired_broker_id = NULL WHERE demand_id = $1`, [req.params.demandId]);
        res.status(200).json({ message: 'Item returned' });
    } catch (error) { next(error); }
};

// --- STUBS FOR ROUTES (Fixes the "Got Undefined" crash) ---
exports.getBrokerReviews = async (req, res, next) => res.json([]);
exports.requestMoreDetails = async (req, res, next) => res.json({ message: 'Requested' });
exports.dismissBrokerInterest = async (req, res, next) => res.json({ message: 'Dismissed' });
exports.unhireBroker = async (req, res, next) => res.json({ message: 'Unhired' });
exports.getHiredDemands = async (req, res, next) => res.json([]);
exports.getPendingInterests = async (req, res, next) => res.json([]);

module.exports = exports;