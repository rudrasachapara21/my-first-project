const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');

function init(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            // ✅ FIX 1: Allow Mobile App (same as server.js)
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    io.use((socket, next) => {
        // Use 'let' because we might modify it
        let token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
            return next(new Error('Authentication error: Token not provided.'));
        }

        // ✅ FIX 2: Remove "Bearer " prefix if it exists
        // (Frontend often sends "Bearer eyJ...", but jwt.verify needs ONLY "eyJ...")
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trim();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Attach basic decoded token info
                socket.user = { user_id: decoded.user_id, role: decoded.role };

                // Extra safety: check user's suspended/verified status
                (async () => {
                    try {
                        const { rows } = await db.query('SELECT is_suspended, email_verified, is_verified FROM users WHERE user_id = $1', [decoded.user_id]);
                        if (rows.length === 0) {
                            return next(new Error('Authentication error: User not found.'));
                        }
                        const userRow = rows[0];
                        if (userRow.is_suspended) return next(new Error('Authentication error: Account suspended.'));
                        if (!userRow.email_verified) return next(new Error('Authentication error: Email not verified.'));
                        if (!userRow.is_verified) return next(new Error('Authentication error: Account not approved.'));
                        // All checks passed
                        next();
                    } catch (e) {
                        console.error('Socket DB check failed:', e && e.message);
                        return next(new Error('Authentication error: Could not validate user.'));
                    }
                })();
        } catch (err) {
            console.error("Socket Auth Failed:", err.message); // Debug log
            return next(new Error('Authentication error: Invalid token.'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: User ${socket.user.user_id}`);
        socket.join(socket.user.user_id.toString());

        socket.on('SEND_MESSAGE', async (data, callback) => {
            try {
                if (!data.conversationId || !data.content) {
                    if (callback) return callback({ status: 'error', message: 'Invalid message format.' });
                    return;
                }
                const senderId = socket.user.user_id;
                
                // 1. Save to DB
                const messageQuery = `
                    INSERT INTO messages (conversation_id, sender_id, content)
                    VALUES ($1, $2, $3) RETURNING *
                `;
                const messageResult = await db.query(messageQuery, [data.conversationId, senderId, data.content]);
                const newMessage = messageResult.rows[0];
                
                // 2. Update Conversation Timestamp
                await db.query(
                    'UPDATE conversations SET last_message_at = $1 WHERE conversation_id = $2',
                    [newMessage.sent_at, data.conversationId]
                );

                // 3. Notify Participants
                const participantsQuery = 'SELECT user_id FROM conversation_participants WHERE conversation_id = $1';
                const participantsResult = await db.query(participantsQuery, [data.conversationId]);

                participantsResult.rows.forEach(({ user_id }) => {
                    io.to(user_id.toString()).emit('NEW_MESSAGE', {
                        conversationId: data.conversationId,
                        message: newMessage,
                    });
                });

                if (callback) callback({ status: 'ok', sentMessage: newMessage });
            } catch (error) {
                console.error("Error in 'SEND_MESSAGE' event:", error);
                if (callback) callback({ status: 'error', message: 'Server could not process the message.' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Client disconnected: User ${socket.user.user_id}`);
        });
    });

    console.log('Socket.IO server initialized.');
    return io;
}

module.exports = { init };