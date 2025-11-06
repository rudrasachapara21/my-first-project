const db = require('../db');
const { createNotification } = require('../services/notificationService');

// ... (createDemand and all other functions at the top of the file remain the same)
exports.createDemand = async (req, res, next) => {
    const { size, clarity, price_per_caret, quantity, private_name, require_till, payment_duration } = req.body;
    const traderId = req.user.user_id;
    if (!size || !clarity || !price_per_caret || !quantity) {
        return res.status(400).json({ message: 'Size, clarity, price per carat, and quantity are required.' });
    }
    const diamond_details = {
        size: parseFloat(size),
        clarity,
        price_per_caret: parseFloat(price_per_caret),
        quantity: parseInt(quantity),
        private_name: private_name || null,
        require_till: require_till || null,
        payment_duration: payment_duration || null,
    };
    try {
        const query = `INSERT INTO demands (trader_id, diamond_details) VALUES ($1, $2) RETURNING *`;
        const { rows } = await db.query(query, [traderId, diamond_details]);
        const newDemand = rows[0];
        req.io.emit('new-demand', newDemand);
        res.status(201).json({ message: 'Demand created successfully!', demand: newDemand });
    } catch (error) {
        next(error);
    }
};
exports.getAllDemands = async (req, res, next) => { try { const query = ` SELECT d.demand_id, d.diamond_details, d.status, d.created_at, (SELECT COUNT(*) FROM demand_interests di WHERE di.demand_id = d.demand_id) AS interest_count FROM demands d WHERE d.status = 'active' ORDER BY d.created_at DESC `; const { rows } = await db.query(query); const publicDemands = rows.map(demand => { if (demand.diamond_details) { delete demand.diamond_details.private_name; } return demand; }); res.status(200).json(publicDemands); } catch (error) { next(error); } };
exports.getMyDemands = async (req, res, next) => { const traderId = req.user.user_id; try { const query = ` SELECT d.*, (SELECT COUNT(*) FROM demand_interests di WHERE di.demand_id = d.demand_id) AS interest_count FROM demands d WHERE d.trader_id = $1 ORDER BY d.created_at DESC `; const { rows } = await db.query(query, [traderId]); res.status(200).json(rows); } catch (error) { next(error); } };
exports.getMyInterests = async (req, res, next) => { const brokerId = req.user.user_id; try { const query = 'SELECT demand_id FROM demand_interests WHERE broker_id = $1'; const { rows } = await db.query(query, [brokerId]); res.status(200).json(rows.map(row => row.demand_id)); } catch (error) { next(error); } };
exports.getDemandById = async (req, res, next) => { const { id } = req.params; const requesterId = req.user.user_id; const requesterRole = req.user.role; try { const demandQuery = ` SELECT d.demand_id, d.trader_id, d.diamond_details, d.status, d.created_at, d.hired_broker_id, t.full_name as trader_full_name, t.office_name as trader_office_name, t.phone_number as trader_phone_number, t.profile_photo_url as trader_profile_photo_url FROM demands d JOIN users t ON d.trader_id = t.user_id WHERE d.demand_id = $1 `; const { rows } = await db.query(demandQuery, [id]); if (rows.length === 0) { return res.status(404).json({ message: 'Demand not found' }); } const demandData = rows[0]; const response = { demand_id: demandData.demand_id, trader_id: demandData.trader_id, diamond_details: demandData.diamond_details, status: demandData.status, created_at: demandData.created_at, hired_broker_id: demandData.hired_broker_id, traderProfile: { user_id: demandData.trader_id, full_name: demandData.trader_full_name, office_name: demandData.trader_office_name, phone_number: demandData.trader_phone_number, profile_photo_url: demandData.trader_profile_photo_url, } }; const isOwner = requesterRole === 'trader' && String(response.trader_id) === String(requesterId); if (isOwner) { const interestQuery = ` SELECT u.user_id, u.full_name, u.profile_photo_url, u.office_name, u.reputation_points FROM demand_interests di JOIN users u ON di.broker_id = u.user_id WHERE di.demand_id = $1 `; const interestRes = await db.query(interestQuery, [id]); response.interested_brokers = interestRes.rows; } if (requesterRole === 'broker') { const interestCheckQuery = 'SELECT interest_id FROM demand_interests WHERE demand_id = $1 AND broker_id = $2'; const interestCheck = await db.query(interestCheckQuery, [id, requesterId]); response.isInterested = interestCheck.rowCount > 0; } if (!isOwner && response.diamond_details) { delete response.diamond_details.private_name; } res.status(200).json(response); } catch (error) { next(error); } };
exports.deleteDemand = async (req, res, next) => { const { id } = req.params; const traderId = req.user.user_id; try { const query = 'DELETE FROM demands WHERE demand_id = $1 AND trader_id = $2 RETURNING demand_id'; const { rows } = await db.query(query, [id, traderId]); if (rows.length === 0) return res.status(403).json({ message: 'Forbidden' }); req.io.emit('demand-deleted', { demandId: id }); res.status(200).json({ message: 'Demand deleted successfully.' }); } catch (error) { next(error); } };
exports.toggleInterest = async (req, res, next) => {
    const { id: demandId } = req.params;
    const brokerId = req.user.user_id;
    const brokerName = req.user.full_name;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const existingQuery = 'SELECT interest_id FROM demand_interests WHERE demand_id = $1 AND broker_id = $2';
        const { rows: existing } = await client.query(existingQuery, [demandId, brokerId]);
        if (existing.length > 0) {
            await client.query('DELETE FROM demand_interests WHERE interest_id = $1', [existing[0].interest_id]);
            await client.query('COMMIT');
            res.status(200).json({ message: 'Interest removed' });
        } else {
            await client.query('INSERT INTO demand_interests (demand_id, broker_id) VALUES ($1, $2)', [demandId, brokerId]);
            const demandQuery = 'SELECT trader_id, diamond_details FROM demands WHERE demand_id = $1';
            const { rows: demandRows } = await client.query(demandQuery, [demandId]);
            if (demandRows.length > 0) {
                const traderId = demandRows[0].trader_id;
                const demandTitle = demandRows[0].diamond_details?.private_name || `Demand #${demandId}`;
                req.io.emit('interest-received', { demandId, brokerId, traderId });
                const message = `${brokerName} has shown interest in your demand: "${demandTitle}"`;
                const linkUrl = `/demand/${demandId}`;
                const newNotification = await createNotification(client, traderId, message, linkUrl);
                req.io.to(traderId.toString()).emit('new_notification', newNotification);
            }
            await client.query('COMMIT');
            res.status(201).json({ message: 'Interest registered' });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

// ## --- THIS FUNCTION HAS BEEN CORRECTED --- ##
exports.completeDemand = async (req, res, next) => {
    const { demandId, brokerId } = req.params;
    const traderId = req.user.user_id;
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        const demandCheck = await client.query(
            "SELECT trader_id FROM demands WHERE demand_id = $1 AND status != 'completed'",
            [demandId]
        );

        if (demandCheck.rowCount === 0 || String(demandCheck.rows[0].trader_id) !== String(traderId)) {
            throw new Error('Forbidden: You do not own this demand or it is already completed.');
        }

        // ## --- THIS IS THE FIX --- ##
        // We now use COALESCE(reputation_points, 0) + 1.
        // This treats any NULL value as 0 before adding 1.
        const updatePointsQuery = `
            UPDATE users 
            SET reputation_points = COALESCE(reputation_points, 0) + 1 
            WHERE user_id = $1
        `;
        await client.query(updatePointsQuery, [brokerId]);
        // ## --- END OF FIX --- ##

        await client.query(
            "UPDATE demands SET status = 'completed' WHERE demand_id = $1 AND trader_id = $2",
            [demandId, traderId]
        );
        
        const message = "A deal was completed and you have been awarded 1 Reputation Point!";
        const linkUrl = `/profile/${brokerId}`;
        const newNotification = await createNotification(client, brokerId, message, linkUrl);
        
        req.io.to(brokerId.toString()).emit('new_notification', newNotification);
        req.io.emit('demand-completed', { demandId: parseInt(demandId) });

        await client.query('COMMIT');
        res.status(200).json({ message: 'Deal marked as complete and reputation point awarded.' });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};
// ## --- END OF CORRECTED FUNCTION --- ##

exports.hireBroker = async (req, res, next) => { const { demandId, brokerId } = req.params; const traderId = req.user.user_id; const client = await db.connect(); try { await client.query('BEGIN'); const demandCheckQuery = ` SELECT d.trader_id, d.diamond_details, u.full_name as trader_name FROM demands d JOIN users u ON d.trader_id = u.user_id WHERE d.demand_id = $1 AND d.trader_id = $2 `; const demandCheck = await client.query(demandCheckQuery, [demandId, traderId]); if (demandCheck.rowCount === 0) { return res.status(403).json({ message: 'Forbidden: You do not own this demand.' }); } const { trader_name, diamond_details } = demandCheck.rows[0]; const demandTitle = diamond_details?.private_name || `Demand #${demandId}`; const updateQuery = 'UPDATE demands SET hired_broker_id = $1 WHERE demand_id = $2'; await client.query(updateQuery, [brokerId, demandId]); const message = `${trader_name} has hired you for the demand: "${demandTitle}"`; const linkUrl = `/broker/demand/${demandId}`; const newNotification = await createNotification(client, brokerId, message, linkUrl); req.io.to(brokerId.toString()).emit('new_notification', newNotification); await client.query('COMMIT'); res.status(200).json({ message: 'Broker hired successfully.' }); } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); } };
exports.dismissBrokerInterest = async (req, res, next) => { const { demandId, brokerId } = req.params; const traderId = req.user.user_id; try { const ownerCheck = await db.query('SELECT trader_id FROM demands WHERE demand_id = $1', [demandId]); if (ownerCheck.rowCount === 0 || String(ownerCheck.rows[0].trader_id) !== String(traderId)) { return res.status(403).json({ message: 'Forbidden: You do not own this demand.' }); } const deleteQuery = 'DELETE FROM demand_interests WHERE demand_id = $1 AND broker_id = $2 RETURNING interest_id'; const result = await db.query(deleteQuery, [demandId, brokerId]); if (result.rowCount === 0) { return res.status(404).json({ message: 'Interest from this broker not found on this demand.' }); } res.status(200).json({ message: 'Broker interest dismissed successfully.' }); } catch (error) { next(error); } };
exports.unhireBroker = async (req, res, next) => { const { demandId, brokerId } = req.params; const traderId = req.user.user_id; const client = await db.connect(); try { await client.query('BEGIN'); const checkQuery = 'SELECT trader_id FROM demands WHERE demand_id = $1 AND trader_id = $2 AND hired_broker_id = $3'; const checkResult = await client.query(checkQuery, [demandId, traderId, brokerId]); if (checkResult.rowCount === 0) { throw new Error('Forbidden: You do not own this demand or this is not the hired broker.'); } const updateQuery = 'UPDATE demands SET hired_broker_id = NULL WHERE demand_id = $1'; await client.query(updateQuery, [demandId]); const message = `The trader has un-hired you from demand #${demandId}. The demand is now open again.`; const linkUrl = `/demand/${demandId}`; const newNotification = await createNotification(client, brokerId, message, linkUrl); req.io.to(brokerId.toString()).emit('new_notification', newNotification); await client.query('COMMIT'); res.status(200).json({ message: 'Broker has been un-hired successfully.' }); } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); } };
exports.getHiredDemands = async (req, res, next) => { const brokerId = req.user.user_id; try { const query = ` SELECT d.demand_id, d.diamond_details, d.status, d.created_at, u.full_name as trader_name FROM demands d JOIN users u ON d.trader_id = u.user_id WHERE d.hired_broker_id = $1 ORDER BY d.created_at DESC `; const { rows } = await db.query(query, [brokerId]); const publicDemands = rows.map(demand => { if (demand.diamond_details) { delete demand.diamond_details.private_name; } return demand; }); res.status(200).json(publicDemands); } catch (error) { next(error); } };
exports.getPendingInterests = async (req, res, next) => { const brokerId = req.user.user_id; try { const query = ` SELECT d.demand_id, d.diamond_details, d.status, d.created_at, u.full_name as trader_name FROM demands d JOIN users u ON d.trader_id = u.user_id WHERE d.demand_id IN ( SELECT di.demand_id FROM demand_interests di WHERE di.broker_id = $1 ) AND d.status = 'active' AND (d.hired_broker_id IS NULL OR d.hired_broker_id != $1) `; const { rows } = await db.query(query, [brokerId]); const publicDemands = rows.map(demand => { if (demand.diamond_details) { delete demand.diamond_details.private_name; } return demand; }); res.status(200).json(publicDemands); } catch (error) { next(error); } };

// --- THIS IS THE ONLY FUNCTION THAT HAS BEEN CHANGED ---
exports.requestMoreDetails = async (req, res, next) => {
    const { id: demandId } = req.params;
    const { user_id: brokerId } = req.user;
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        
        const demandQuery = `
            SELECT 
                d.demand_id, d.trader_id, d.diamond_details,
                u.full_name, u.office_address, u.office_hours, u.reputation_points
            FROM demands d
            JOIN users u ON d.trader_id = u.user_id
            WHERE d.demand_id = $1
        `;
        const { rows: demandRows } = await client.query(demandQuery, [demandId]);

        if (demandRows.length === 0) {
            return res.status(404).json({ message: 'Demand not found.' });
        }

        const demand = demandRows[0];
        const details = demand.diamond_details || {};
        const traderId = demand.trader_id;

        // --- THE FIX: Replaced markdown with a clean, professional text format ---
        
        // Helper function to format the date cleanly
        const formatRequiredBy = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            } catch (e) {
                return dateString; // Fallback to original string if formatting fails
            }
        };

        const messageBody = [
            'Hello! Here are the full details for the demand you requested.',
            '',
            '--- Diamond Details ---',
            `Size: ${details.size || 'N/A'}ct`,
            `Clarity: ${details.clarity || 'N/A'}`,
            `Price/ct: ₹${details.price_per_caret ? parseInt(details.price_per_caret).toLocaleString('en-IN') : 'N/A'}`,
            `Quantity: ${details.quantity || 'N/A'}`,
            `Required By: ${formatRequiredBy(details.require_till)}`,
            `Payment Duration: ${details.payment_duration || 'N/A'}`,
            '',
            '--- Trader Information ---',
            `Office Address: ${demand.office_address || 'N/Access denied'}`,
            `Office Hours: ${demand.office_hours || 'N/A'}`,
            `Reputation: ${demand.reputation_points || 0} Points`,
            '',
            'Feel free to reply here with any further questions.'
        ].join('\n'); // Join all lines with a newline character

        let conversationId;
        const findConvQuery = `
            SELECT conversation_id FROM conversation_participants 
            WHERE conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = $1)
            AND user_id = $2
        `;
        const { rows: convRows } = await client.query(findConvQuery, [brokerId, traderId]);

        if (convRows.length > 0) {
            conversationId = convRows[0].conversation_id;
        } else {
            const newConvQuery = 'INSERT INTO conversations DEFAULT VALUES RETURNING conversation_id';
            const { rows: newConvRows } = await client.query(newConvQuery);
            conversationId = newConvRows[0].conversation_id;

            const addParticipantsQuery = 'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)';
            await client.query(addParticipantsQuery, [conversationId, brokerId, traderId]);
        }
        
        const insertMessageQuery = `
            INSERT INTO messages (conversation_id, sender_id, content)
            VALUES ($1, $2, $3) RETURNING *
        `;
        const { rows: messageRows } = await client.query(insertMessageQuery, [conversationId, traderId, messageBody]);
        const newMessage = messageRows[0];
        
        req.io.to(brokerId.toString()).emit('new_message', newMessage);

        await client.query('COMMIT');
        res.status(200).json({ message: 'The full details have been sent to your chat with the trader.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in requestMoreDetails:", error);
        next(error);
    } finally {
        client.release();
    }
};