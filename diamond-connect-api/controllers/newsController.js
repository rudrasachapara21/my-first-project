// controllers/newsController.js
const db = require('../db');

exports.getAllNews = async (req, res) => {
    try {
        const query = "SELECT * FROM news ORDER BY created_at DESC";
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Get all news error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.createNewsArticle = async (req, res) => {
    const { title, content, image_url } = req.body;
    const adminId = req.user.userId;

    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required." });
    }
    
    try {
        const query = `
            INSERT INTO news (admin_id, title, content, image_url)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        const { rows } = await db.query(query, [adminId, title, content, image_url || null]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error("Create news error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteNewsArticle = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM news WHERE news_id = $1 RETURNING news_id', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error("Delete news error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getArticleById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = "SELECT * FROM news WHERE news_id = $1";
        const { rows } = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Article not found" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Get article by id error:", error);
        res.status(500).json({ message: "Server error" });
    }
};