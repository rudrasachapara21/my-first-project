const db = require('../db');

// This function can remain as it is
exports.startConversation = async (req, res) => { /* ... no changes needed here ... */ };

// REPLACE the getConversations function with this new version
exports.getConversations = async (req, res) => {
    const userId = req.user.userId;
    try {
        const query = `
            WITH ranked_messages AS (
                SELECT
                    m.conversation_id,
                    m.message_content,
                    m.sent_at,
                    ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.sent_at DESC) as rn
                FROM messages m
                WHERE m.conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = $1)
            )
            SELECT DISTINCT ON (cp.conversation_id)
                cp.conversation_id,
                u.user_id as partner_id,
                u.full_name as partner_name,
                lm.message_content as last_message,
                lm.sent_at as last_message_timestamp
            FROM conversation_participants cp
            JOIN users u ON cp.user_id = u.user_id
            LEFT JOIN (SELECT * FROM ranked_messages WHERE rn = 1) lm ON lm.conversation_id = cp.conversation_id
            WHERE cp.conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = $1)
            AND cp.user_id != $1
            ORDER BY cp.conversation_id, lm.sent_at DESC NULLS LAST;
        `;
        const { rows } = await db.query(query, [userId]);
        
        // Sort by the most recent message after fetching
        rows.sort((a, b) => {
            if (!a.last_message_timestamp) return 1;
            if (!b.last_message_timestamp) return -1;
            return new Date(b.last_message_timestamp) - new Date(a.last_message_timestamp);
        });

        res.json(rows.map(convo => ({
            ...convo,
            last_message: convo.last_message || 'No messages yet'
        })));
    } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// This function can remain as it is
exports.getMessagesForConversation = async (req, res) => { /* ... no changes needed here ... */ };