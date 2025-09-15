// controllers/authController.js
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    try {
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const { rows } = await db.query(userQuery, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials." });
        }
        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const payload = { userId: user.user_id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        const userResponse = {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        };
        
        res.json({ token, user: userResponse });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Server error during login." });
    }
};

exports.createUser = async (req, res) => {
    const { full_name, email, password, role } = req.body;
    if (!full_name || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required." });
    }
    if (role !== 'trader' && role !== 'broker') {
        return res.status(400).json({ message: "Role must be either 'trader' or 'broker'." });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        const newUserQuery = `
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES ($1, $2, $3, $4) RETURNING user_id, full_name, email, role
        `;
        const { rows } = await db.query(newUserQuery, [full_name, email, password_hash, role]);
        
        res.status(201).json({
            message: "User created successfully!",
            user: rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        console.error('Create user error:', error);
        res.status(500).json({ message: "Server error during user creation." });
    }
};

exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    try {
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const { rows } = await db.query(userQuery, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials." });
        }
        const user = rows[0];

        if (user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Not an admin account." });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const payload = { userId: user.user_id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        const userResponse = {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        };
        
        res.json({ token, user: userResponse });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: "Server error during admin login." });
    }
};