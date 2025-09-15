// websocket.js
const WebSocket = require('ws');
const db = require('./db'); // Your database connection
const jwt = require('jsonwebtoken');
const url = require('url');

// This will store active connections, mapping a userId to their WebSocket connection
const clients = new Map();

function initializeWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async (ws, req) => {
        // Extract token from the connection URL, e.g., ws://localhost:5001?token=...
        const token = url.parse(req.url, true).query.token;

        if (!token) {
            console.log("WebSocket connection rejected: No token provided.");
            ws.close();
            return;
        }

        let userId;
        try {
            // Verify the token to identify the user
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
            
            // Store the user's connection
            clients.set(userId, ws);
            console.log(`WebSocket client connected: User ${userId}`);

        } catch (error) {
            console.log("WebSocket connection rejected: Invalid token.");
            ws.close();
            return;
        }

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                const { conversationId, message_content } = data;
                
                // 1. Save the new message to the database
                const messageQuery = 'INSERT INTO messages (conversation_id, sender_id, message_content) VALUES ($1, $2, $3) RETURNING *';
                const messageResult = await db.query(messageQuery, [conversationId, userId, message_content]);
                const newMessage = messageResult.rows[0];

                // 2. Find the recipient(s) of the message
                const participantsQuery = 'SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2';
                const participantsResult = await db.query(participantsQuery, [conversationId, userId]);

                // 3. Broadcast the message to the recipient(s) if they are online
                participantsResult.rows.forEach(participant => {
                    const recipientSocket = clients.get(participant.user_id);
                    if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
                        recipientSocket.send(JSON.stringify(newMessage));
                    }
                });

            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        });

        ws.on('close', () => {
            // Remove the client from our map when they disconnect
            clients.delete(userId);
            console.log(`WebSocket client disconnected: User ${userId}`);
        });
    });

    console.log('WebSocket server initialized.');
}

module.exports = { initializeWebSocket };