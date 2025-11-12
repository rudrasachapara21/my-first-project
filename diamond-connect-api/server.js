require('dotenv').config();

// ## --- DEBUG LINES --- ##
// This will now print all three keys to your terminal
console.log("SERVER STARTING - Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("SERVER STARTING - API Key:", process.env.CLOUDINARY_API_KEY);
console.log("SERVER STARTING - API Secret:", process.env.CLOUDINARY_API_SECRET);
// ## --- END OF DEBUG LINES --- ##

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const { setupDatabase } = require('./setup.js');
const { createAdminUser } = require('./seed.js');

const app = express();
const server = http.createServer(app);

const websocket = require('./websocket');
// We initialize Socket.IO, which will read the .env variable itself
const io = websocket.init(server);

app.use(cors({
  origin: process.env.CORS_ORIGIN
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = process.env.RENDER_DISK_PATH || 'uploads';
app.use('/uploads', express.static(uploadDir));


app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- Route Imports ---
const authRoutes = require('./routes/auth.js');
const usersRoutes = require('./routes/usersRoutes.js');
const demandRoutes = require('./routes/demandRoutes.js');
const listingRoutes = require('./routes/listingRoutes.js');
const profileRoutes = require('./routes/profileRoutes.js');
const newsRoutes = require('./routes/newsRoutes.js');
const searchRoutes = require('./routes/searchRoutes.js');
const conversationRoutes = require('./routes/conversationRoutes.js');
const statsRoutes = require('./routes/statsRoutes.js');
const watchlistRoutes = require('./routes/watchlistRoutes.js');
const offerRoutes = require('./routes/offerRoutes.js');
const notificationRoutes = require('./routes/notificationRoutes.js');
const supportRoutes = require('./routes/supportRoutes.js');
const pricingRoutes = require('./routes/pricingRoutes.js');
const reviewRoutes = require('./routes/reviewRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');


// --- API Endpoints ---
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);


// --- Error Handling ---
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    console.error("An error occurred:", err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'An internal server error occurred.'
    });
});

// --- Server Start ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Server is live on http://localhost:${PORT}`);
});