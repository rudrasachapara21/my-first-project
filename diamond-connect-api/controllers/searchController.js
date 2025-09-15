// controllers/searchController.js
const db = require('../db'); // THIS LINE WAS MISSING

exports.searchUsers = async (req, res) => {
    const { query } = req.query;
    const currentUserId = req.user.userId;

    if (!query) {
        return res.status(400).json({ message: "A search query is required." });
    }

    try {
        const searchQuery = `
            SELECT user_id, full_name, office_name, role 
            FROM users 
            WHERE 
                (full_name ILIKE $1 OR office_name ILIKE $1)
                AND user_id != $2 
                AND role != 'admin'
            LIMIT 10
        `;
        const { rows } = await db.query(searchQuery, [`%${query}%`, currentUserId]);
        
        res.json(rows);
    } catch (error) {
        console.error("User search error:", error);
        res.status(500).json({ message: "Server error during user search." });
    }
};