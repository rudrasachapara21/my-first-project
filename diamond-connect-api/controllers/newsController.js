const db = require('../db');

/**
 * Creates a new news article.
 * @access Admin only
 */
exports.createNewsArticle = async (req, res, next) => {
    const { title, content, image_url } = req.body;
    // BUG FIX: The property on req.user is user_id, not userId.
    const adminId = req.user.user_id;

    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required." });
    }

    try {
        const query = `
            INSERT INTO news (admin_id, title, content, image_url)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        const values = [adminId, title, content, image_url || null];
        const { rows } = await db.query(query, values);
        const newArticle = rows[0];

        // Notify all clients of the new article
        req.io.emit('new-article', newArticle);

        res.status(201).json(newArticle);
    } catch (error) {
        console.error("Create news error:", error);
        next(error);
    }
};

/**
 * Retrieves all news articles, ordered by most recent.
 * @access Authenticated users
 */
exports.getAllNews = async (req, res, next) => {
    try {
        const query = "SELECT * FROM news ORDER BY created_at DESC";
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Get all news error:", error);
        next(error);
    }
};

/**
 * Retrieves a single news article by its ID.
 * @access Authenticated users
 */
exports.getArticleById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = "SELECT * FROM news WHERE news_id = $1";
        const { rows } = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Article not found" });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Get article by id error:", error);
        next(error);
    }
};

/**
 * Updates an existing news article.
 * @access Admin only
 */
exports.updateNewsArticle = async (req, res, next) => {
    const { id } = req.params;
    const { title, content, image_url } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required." });
    }

    try {
        const query = `
            UPDATE news
            SET title = $1, content = $2, image_url = $3
            WHERE news_id = $4
            RETURNING *
        `;
        const values = [title, content, image_url || null, id];
        const { rows } = await db.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Article not found" });
        }

        const updatedArticle = rows[0];
        // Notify all clients that an article was updated
        req.io.emit('article-updated', updatedArticle);

        res.status(200).json(updatedArticle);
    } catch (error) {
        console.error("Update news error:", error);
        next(error);
    }
};

/**
 * Deletes a news article by its ID.
 * @access Admin only
 */
exports.deleteNewsArticle = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = 'DELETE FROM news WHERE news_id = $1 RETURNING news_id';
        const result = await db.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }

        // Notify all clients that an article was deleted
        req.io.emit('article-deleted', { newsId: id });

        res.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error("Delete news error:", error);
        next(error);
    }
};