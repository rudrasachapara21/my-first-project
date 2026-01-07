const db = require('../db');

// Get Table Data
exports.getStatement = async (req, res, next) => {
    const userId = req.user.user_id;
    try {
        const query = `
            SELECT t.*, u_buyer.full_name as buyer_name, u_seller.full_name as seller_name,
                   l.shape, l.carat, l.clarity
            FROM transactions t
            LEFT JOIN listings l ON t.listing_id = l.listing_id
            LEFT JOIN users u_buyer ON t.buyer_id = u_buyer.user_id
            LEFT JOIN users u_seller ON t.seller_id = u_seller.user_id
            WHERE t.buyer_id = $1 OR t.seller_id = $1
            ORDER BY t.transaction_date DESC
        `;
        const { rows } = await db.query(query, [userId]);
        
        const data = rows.map(r => ({
            ...r,
            type: r.seller_id === userId ? 'CREDIT' : 'DEBIT',
            party_name: r.seller_id === userId ? r.buyer_name : r.seller_name
        }));
        res.json(data);
    } catch (error) { next(error); }
};

// Get Chart Data
exports.getAnalytics = async (req, res, next) => {
    const userId = req.user.user_id;
    try {
        const query = `
            SELECT TO_CHAR(transaction_date, 'Mon') as name, SUM(final_amount) as value
            FROM transactions WHERE seller_id = $1 
            GROUP BY 1, DATE_TRUNC('month', transaction_date) 
            ORDER BY DATE_TRUNC('month', transaction_date)
        `;
        const { rows } = await db.query(query, [userId]);
        res.json(rows);
    } catch (error) { next(error); }
};