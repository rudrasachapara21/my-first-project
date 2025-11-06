require('dotenv').config();
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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = process.env.RENDER_DISK_PATH || 'uploads';
if (!fs.existsSync(uploadDir)) {
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
// ## --- NEW ROUTE IMPORTED --- ##
const reviewRoutes = require('./routes/reviewRoutes.js');


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
// ## --- NEW ENDPOINT ADDED --- ##
app.use('/api/reviews', reviewRoutes);


// ## NEW SECTION: SERVE FRONTEND STATIC FILES ##
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));


// ## NEW SECTION: HANDLE ALL OTHER ROUTES FOR REACT ROUTER ##
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});


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