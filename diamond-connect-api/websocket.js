const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');

function init(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            // --- THIS IS THE CORRECTED LINE ---
            origin: process.env.CORS_ORIGIN, 
            methods: ["GET", "POST"]
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
            return next(new Error('Authentication error: Token not provided.'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = { user_id: decoded.user_id, role: decoded.role };
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token.'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: User ${socket.user.user_id}`);
        socket.join(socket.user.user_id.toString());

        socket.on('SEND_MESSAGE', async (data, callback) => {
            try {
                if (!data.conversationId || !data.content) {
                    return callback({ status: 'error', message: 'Invalid message format.' });
                }
                const senderId = socket.user.user_id;
                const messageQuery = `
                    INSERT INTO messages (conversation_id, sender_id, content)
                    VALUES ($1, $2, $3) RETURNING *
                `;
                const messageResult = await db.query(messageQuery, [data.conversationId, senderId, data.content]);
                const newMessage = messageResult.rows[0];
                
                await db.query(
                    'UPDATE conversations SET last_message_at = $1 WHERE conversation_id = $2',
                    [newMessage.sent_at, data.conversationId]
                );

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