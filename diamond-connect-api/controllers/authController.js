const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendRegistrationOtp } = require('./otpController');

/**
 * Handles new user registration.
 * - Inserts user with is_verified = false (admin approval pending) and email_verified = false
 * - Generates and emails an OTP for email verification
 */
exports.register = async (req, res, next) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required." });
    }
    if (role !== 'trader' && role !== 'broker') {
        return res.status(400).json({ message: "Invalid user role specified." });
    }

    try {
        const existingUser = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO users (full_name, email, password_hash, role, is_verified, email_verified, created_at)
            VALUES ($1, $2, $3, $4, false, false, NOW())
            RETURNING user_id, email, role, is_verified, email_verified
        `;
        const { rows } = await db.query(query, [fullName, email, passwordHash, role]);
        const newUser = rows[0];

        // Send OTP email (non-blocking response if desired)
        try {
            await sendRegistrationOtp({ email, name: fullName });
        } catch (e) {
            console.error('Failed to send OTP email:', e.message);
        }

        res.status(201).json({
            message: "Registration successful! We sent an OTP to your email to verify your account.",
            user: newUser
        });

    } catch (error) {
        console.error("Registration error:", error);
        next(error);
    }
};

/**
 * Handles user login.
 * Requires: email_verified === true AND is_verified === true (admin approved)
 */
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const query = 'SELECT user_id, full_name, email, role, password_hash, is_verified, email_verified, is_suspended FROM users WHERE email = $1';
        const { rows } = await db.query(query, [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        if (!user.email_verified) {
            return res.status(403).json({ message: "Please verify your email via the OTP sent to you." });
        }

        if (user.is_verified === false) {
            return res.status(403).json({ message: "Your account is awaiting admin approval." });
        }

        if (user.is_suspended) {
            return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });
        }

        const payload = { user_id: user.user_id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: "Login successful!",
            token,
            refreshToken,
            user: {
                id: user.user_id,
                fullName: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        // Database connection errors (macOS Postgres auth dialog issue)
        if (error.code === 'XX000' || error.code === '57P03' || error.message?.includes('auth_permission_dialog')) {
            console.error('🔴 CRITICAL DATABASE ERROR - macOS Postgres Socket Issue:', error.message);
            console.error('💡 FIX: Update DATABASE_URL to use 127.0.0.1 instead of localhost');
            return res.status(503).json({ 
                message: 'Database connection failed. Please check server configuration.',
                hint: 'Server needs to use 127.0.0.1 instead of localhost for macOS Postgres'
            });
        }
        
        console.error("Login error:", error);
        next(error);
    }
};

/**
 * Handles JWT token refresh.
 * Generates a new token with extended expiry.
 */
exports.refreshToken = async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required." });
    }

    try {
        // Verify the refresh token (using same secret but longer expiry)
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Fetch user to ensure they're still valid
        const query = 'SELECT user_id, full_name, email, role, is_verified, email_verified, is_suspended FROM users WHERE user_id = $1';
        const { rows } = await db.query(query, [decoded.user_id]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: "User not found." });
        }

        if (user.is_suspended) {
            return res.status(403).json({ message: "Account suspended." });
        }

        if (!user.email_verified || !user.is_verified) {
            return res.status(403).json({ message: "Account not fully verified." });
        }

        // Generate new access token
        const payload = { user_id: user.user_id, role: user.role };
        const newToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({
            token: newToken,
            user: {
                id: user.user_id,
                fullName: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Token refresh error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Invalid or expired refresh token." });
        }
        next(error);
    }
};