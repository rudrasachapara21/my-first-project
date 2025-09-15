// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../db.js');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(403).json({ message: 'A token is required for authentication' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('Decoded user from token:', req.user); 
    } catch (err) {
        return res.status(401).json({ message: 'Invalid Token' });
    }
    return next();
};

exports.isTrader = async (req, res, next) => {
    console.log(`Checking isTrader. User role is: ${req.user.role}`);
    if (req.user.role === 'trader') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Traders only.' });
};

exports.isBroker = async (req, res, next) => {
    console.log(`Checking isBroker. User role is: ${req.user.role}`);
    if (req.user.role === 'broker') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Brokers only.' });
};

// **** THIS IS THE MISSING FUNCTION ****
exports.isAdmin = (req, res, next) => {
    console.log(`Checking isAdmin. User role is: ${req.user.role}`);
    if (req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Admins only.' });
};