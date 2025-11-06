const db = require('../db');

exports.submitQuery = async (req, res, next) => {
    const { query_text } = req.body;
    
    // --- THE FINAL FIX: Changed req.user.userId to req.user.user_id ---
    // This now correctly matches the object provided by the auth middleware.
    const userId = req.user.user_id; 

    if (!userId) {
        return res.status(401).json({ message: "Authentication error. User ID not found." });
    }

    if (!query_text) {
        return res.status(400).json({ message: "Query message is required." });
    }

    try {
        const query = `
            INSERT INTO support_queries (user_id, query_text, status)
            VALUES ($1, $2, 'open') RETURNING query_id
        `;
        
        const { rows } = await db.query(query, [userId, query_text]);
        
        res.status(201).json({ 
            message: "Support query submitted successfully. We will get back to you shortly.",
            ticketId: rows[0].query_id 
        });
    } catch (error) {
        console.error("Error submitting support query:", error);
        next(error);
    }
};