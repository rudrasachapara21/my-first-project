// server.js
require('dotenv').config();

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const url = require('url');
const jwt = require('jsonwebtoken');

// --- Import all routes ---
const authRoutes = require('./routes/auth');
const demandRoutes = require('./routes/demandRoutes');
const listingRoutes = require('./routes/listingRoutes');
const newsRoutes = require('./routes/newsRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const supportRoutes = require('./routes/supportRoutes');
const profileRoutes = require('./routes/profileRoutes');
const usersRoutes = require('./routes/usersRoutes');
const searchRoutes = require('./routes/searchRoutes');
const db = require('./db.js');

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware setup ---
app.use(cors());
app.use(express.json());

// --- Create HTTP and WebSocket Servers ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map();

app.use((req, res, next) => {
  req.clients = clients;
  next();
});

// --- Use the routes ---
app.use('/api/auth', authRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/search', searchRoutes);

wss.on('connection', (ws, req) => {
  const token = url.parse(req.url, true).query.token;
  if (!token) { ws.close(1008, 'Token required'); return; }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) { ws.close(1008, 'Invalid token'); return; }

    const userId = decoded.userId;
    console.log(`Client with userId ${userId} connected.`);
    clients.set(userId, ws);

    ws.on('message', async (message) => {
      // --- THIS IS THE NEW LOGIC ---
      try {
        const data = JSON.parse(message);

        // We check for conversationId to identify this as a chat message
        if (data.conversationId && data.message_content) {
          const { conversationId, message_content } = data;

          // 1. Save the message to the database
          const messageQuery = 'INSERT INTO messages (conversation_id, sender_id, message_content) VALUES ($1, $2, $3) RETURNING *';
          const messageResult = await db.query(messageQuery, [conversationId, userId, message_content]);
          const newMessage = messageResult.rows[0];

          // 2. Find the other participants in the conversation
          const participantsQuery = 'SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2';
          const participantsResult = await db.query(participantsQuery, [conversationId, userId]);

          // 3. Send the new message to each participant if they are online
          participantsResult.rows.forEach(participant => {
            const recipientSocket = clients.get(participant.user_id);
            if (recipientSocket && recipientSocket.readyState === 1) { // 1 means WebSocket.OPEN
              recipientSocket.send(JSON.stringify(newMessage));
            }
          });
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      }
      // --- END OF NEW LOGIC ---
    });

    ws.on('close', () => {
      console.log(`Client with userId ${userId} has disconnected.`);
      clients.delete(userId);
    });
  });
});

// --- Start the server ---
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});