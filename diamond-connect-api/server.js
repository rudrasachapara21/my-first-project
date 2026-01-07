require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
// NOTE: Avoid adding new runtime dependencies to keep installs simple.
const fs = require('fs');

// Database & Seed Imports
const { setupDatabase } = require('./setup.js');
const { createAdminUser } = require('./seed.js');

const app = express();
const server = http.createServer(app);

// WebSocket Setup
const websocket = require('./websocket');
const io = websocket.init(server);

// --- MIDDLEWARE & CORS ---
// Use environment-configurable allowed origins. Default to '*' for development.
const rawAllowed = process.env.ALLOWED_ORIGINS || '*';
const allowedOrigins = rawAllowed === '*' ? ['*'] : rawAllowed.split(',').map(s => s.trim());

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin like mobile apps or curl
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy: This origin is not allowed'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- SECURITY HEADERS (lightweight alternative to helmet) ---
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// --- RATE LIMITER (prefer Redis-backed, fallback to in-memory) ---
const rateWindowMs = parseInt(process.env.RATE_WINDOW_MS || '900000'); // 15 minutes
const rateMax = parseInt(process.env.RATE_MAX || '300'); // 300 requests per window by default

let usedRedisLimiter = false;
try {
    const REDIS_URL = process.env.REDIS_URL;
    if (REDIS_URL) {
        try {
            const rateLimit = require('express-rate-limit');
            const RedisStore = require('rate-limit-redis');
            const { createClient } = require('redis');

            const redisClient = createClient({ url: REDIS_URL });
            // Connect but don't block startup if it fails; log errors
            redisClient.connect().then(() => {
                console.log('✅ Connected to Redis for rate limiting.');
            }).catch((e) => {
                console.warn('⚠️ Redis connection failed:', e && e.message);
            });

            const limiter = rateLimit({
                windowMs: rateWindowMs,
                max: rateMax,
                standardHeaders: true,
                legacyHeaders: false,
                store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) })
            });

            app.use(limiter);
            usedRedisLimiter = true;
            console.log('Using Redis-backed rate limiter.');
        } catch (e) {
            console.warn('Redis-backed rate limiter not available or failed to initialize. Falling back to in-memory limiter.');
            // Continue to fallback below
        }
    }
} catch (err) {
    console.error('Rate limiter setup error:', err && err.message);
}

if (!usedRedisLimiter) {
    // Fallback in-memory limiter for development
    const ipMap = new Map();
    app.use((req, res, next) => {
        try {
            const ip = req.ip || req.connection.remoteAddress || 'unknown';
            const now = Date.now();
            const entry = ipMap.get(ip) || { count: 0, start: now };
            if (now - entry.start > rateWindowMs) {
                entry.count = 1;
                entry.start = now;
            } else {
                entry.count += 1;
            }
            ipMap.set(ip, entry);
            if (entry.count > rateMax) {
                res.status(429).json({ message: 'Too many requests. Please try again later.' });
                return;
            }
        } catch (e) {
            // Non-fatal: if rate limiter fails, continue
            console.error('Rate limiter error:', e && e.message);
        }
        next();
    });
    console.log('Using in-memory rate limiter (dev only).');
}

// Increase default body size limits to handle large image uploads (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- UPLOAD DIRECTORY SETUP ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`✅ Created upload directory at: ${uploadDir}`);
    } catch (err) {
        console.error(`❌ Failed to create upload directory: ${err.message}`);
    }
}
app.use('/uploads', express.static(uploadDir));

// Attach Socket.IO to requests
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- RUNTIME SANITY CHECKS ---
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET is not set. For production, set a strong JWT_SECRET in environment variables.');
}

// --- PRODUCTION SAFETY CHECKS ---
// In production we require certain env vars to be set to avoid accidental insecure starts.
if (process.env.NODE_ENV === 'production') {
    const missing = [];
    if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
    if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
    // Require explicit allowed origins in production (no wildcard)
    const rawAllowedProd = process.env.ALLOWED_ORIGINS || '';
    if (!rawAllowedProd || rawAllowedProd.trim() === '' || rawAllowedProd.trim() === '*') missing.push('ALLOWED_ORIGINS (must not be "*")');

    if (missing.length > 0) {
        console.error('🚨 Missing required environment variables for production:', missing.join(', '));
        console.error('Refusing to start in production with insecure configuration.');
        process.exit(1);
    }
}

// --- HEALTH CHECK (Keeps Render Awake) ---
app.get('/health', (req, res) => {
  res.status(200).send('Diamond Connect API is awake and healthy! 🚀');
});

// --- FACE DETECTION HEALTH ---
app.get('/api/face-detection/health', async (req, res) => {
    try {
        // Try to require optional libs
        const faceapi = require('face-api.js');
        const canvas = require('canvas');
        const tf = require('@tensorflow/tfjs-node');
        const path = require('path');
        const modelsPath = path.join(__dirname, 'models');
        const fs = require('fs');

        // Quick manifest check
        const manifestPath = path.join(modelsPath, 'tiny_face_detector_model-weights_manifest.json');
        if (!fs.existsSync(manifestPath)) {
            return res.status(503).json({ ready: false, message: 'Face detection models missing in diamond-connect-api/models' });
        }

        // Try to load the tiny face detector model (this will validate that weights are usable)
        try {
            // Patch monkey-patch for node-canvas
            const { Canvas, Image, ImageData } = canvas;
            faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
            await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
        } catch (loadErr) {
            return res.status(503).json({ ready: false, message: 'Failed to load face detector model: ' + (loadErr.message || loadErr) });
        }

        return res.status(200).json({ ready: true, message: 'Face detection models are present and loaded.' });
    } catch (err) {
        return res.status(503).json({ ready: false, message: 'Face detection libraries not installed: ' + (err.message || err) });
    }
});

app.get('/', (req, res) => {
  res.send('Diamond Connect API is running.');
});

// --- ROUTE IMPORTS ---
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
const reportRoutes = require('./routes/reportRoutes.js'); 
const transactionRoutes = require('./routes/transactionRoutes.js');

// --- API ENDPOINTS (Routes) ---
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

// Financial System Routes
app.use('/api/reports', reportRoutes); 
app.use('/api/transactions', transactionRoutes);


// --- ERROR HANDLING (Must be LAST) ---
app.use((req, res, next) => {
    console.log(`❌ 404 Hit: ${req.method} ${req.originalUrl}`);
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

// --- SERVER START ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Server is live on http://localhost:${PORT}`);
});