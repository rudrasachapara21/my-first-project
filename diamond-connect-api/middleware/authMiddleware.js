const jwt = require('jsonwebtoken');
const db = require('../db');

// It's recommended to set a strong, unique secret in your .env file
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to verify the JWT from the Authorization header.
 * If the token is valid, it fetches the user from the database
 * and attaches them to the request object as `req.user`.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token is required.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // ## --- UPDATED QUERY --- ##
        // Fetch the user and their suspension status
        const query = 'SELECT user_id, full_name, email, role, is_suspended FROM users WHERE user_id = $1';
        const { rows } = await db.query(query, [decoded.user_id]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'User associated with this token not found.' });
        }

        // ## --- NEW CHECK --- ##
        // Check if the user is suspended
        if (rows[0].is_suspended) {
            return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });
        }

        // Attach user information to the request object for use in subsequent routes
        req.user = rows[0];
        next();

    } catch (err) {
        console.error('Authentication error:', err.message);
        // Catches errors from jwt.verify (e.g., expired token, invalid signature)
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
}

/**
 * Middleware to check if the authenticated user has the 'admin' role.
 * Must be used after verifyToken.
 */
function isAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden. Admin access is required.' });
    }
    next();
}

/**
 * Middleware to check if the authenticated user has the 'trader' role.
 * Must be used after verifyToken.
 */
function isTrader(req, res, next) {
    if (req.user?.role !== 'trader') {
        return res.status(4403).json({ message: 'Forbidden. Trader access is required.' });
    }
    next();
}

/**
 * Middleware to check if the authenticated user has the 'broker' role.
 * Must be used after verifyToken.
 */
function isBroker(req, res, next) {
    if (req.user?.role !== 'broker') {
        return res.status(403).json({ message: 'Forbidden. Broker access is required.' });
    }
    next();
}

module.exports = {
    verifyToken,
    isAdmin,
    isTrader,
    isBroker,
};