require('dotenv').config();

// ## --- DEBUG LINES --- ##
console.log("SERVER STARTING - Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("SERVER STARTING - API Key:", process.env.CLOUDINARY_API_KEY ? "Set" : "Not Set"); 
// Hiding secret for security in logs, just checking if it exists
console.log("SERVER STARTING - API Secret:", process.env.CLOUDINARY_API_SECRET ? "Set" : "Not Set");
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
const io = websocket.init(server);

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*' // Fallback to * if env is missing
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = process.env.RENDER_DISK_PATH || 'uploads';
// Ensure upload directory exists to prevent startup errors
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
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


// --- Improved Error Handling ---

// 1. Handle 404 (Not Found)
app.use((req, res, next) => {
    // We include the URL so you know WHAT was not found
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

// 2. Global Error Handler
app.use((err, req, res, next) => {
    // If it's a 404, just warn (don't clutter logs with stack traces)
    if (err.status === 404) {
        console.warn(`[404] ${err.message}`);
    } else {
        // If it's a real server error (500), log the full stack
        console.error("SERVER ERROR:", err);
    }

    res.status(err.status || 500).json({
        message: err.message || 'An internal server error occurred.'
    });
});

// --- Server Start ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Server is live on http://localhost:${PORT}`);
});