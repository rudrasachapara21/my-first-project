// controllers/supportController.js
const db = require('../db');

exports.submitQuery = async (req, res) => {
    const { query_text } = req.body;
    const userId = req.user.userId;

    if (!query_text) {
        return res.status(400).json({ message: 'Query text cannot be empty.' });
    }

    try {
        const newQuery = `
            INSERT INTO support_queries (user_id, query_text)
            VALUES ($1, $2)
            RETURNING *
        `;
        const { rows } = await db.query(newQuery, [userId, query_text]);
        res.status(201).json({ 
            message: 'Your query has been submitted successfully!',
            query: rows[0]
        });
    } catch (error) {
        console.error('Submit query error:', error);
        res.status(500).json({ message: 'Server error while submitting query.' });
    }
};