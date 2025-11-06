/**
 * Creates a notification in the database within a transaction.
 * @param {object} dbClient - The active PostgreSQL client from a transaction.
 * @param {number} userId - The ID of the user who will receive the notification.
 * @param {string} message - The text content of the notification.
 * @param {string} [linkUrl=null] - An optional URL for the notification to link to.
 * @returns {Promise<object>} A promise that resolves to the newly created notification record.
 */
exports.createNotification = async (dbClient, userId, message, linkUrl = null) => {
    const query = `
        INSERT INTO notifications (user_id, message, link_url)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const { rows } = await dbClient.query(query, [userId, message, linkUrl]);
    return rows[0];
};