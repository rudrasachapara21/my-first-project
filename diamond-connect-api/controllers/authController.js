const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * ## UPDATED: Handles new user registration.
 * Creates a new user with 'is_verified' set to 'false'.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.register = async (req, res, next) => {
    const { fullName, email, password, role } = req.body;

    // 1. Validate input
    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required." });
    }
    
    if (role !== 'trader' && role !== 'broker') {
         return res.status(400).json({ message: "Invalid user role specified." });
    }

    try {
        // 2. Check if user already exists
        const existingUser = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. ## FIX: Insert new user with 'is_verified = false' ##
        // This marks them as 'pending'
        const query = `
            INSERT INTO users (full_name, email, password_hash, role, is_verified, created_at)
            VALUES ($1, $2, $3, $4, false, NOW())
            RETURNING user_id, email, role, is_verified
        `;
        const { rows } = await db.query(query, [fullName, email, passwordHash, role]);
        const newUser = rows[0];

        // 5. Send success response (NO TOKEN)
        res.status(201).json({
            message: "Registration successful! Your account is awaiting admin approval.",
            user: newUser
        });

    } catch (error) {
        console.error("Registration error:", error);
        next(error); // Pass error to global handler
    }
};


/**
 * Handles user login.
 * Verifies user credentials and returns a JWT if successful.
 * @param {object} req - The Express request object.
 *... (rest of the file)
 */
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        // 2. Find the user by email
        // ## FIX: Select 'is_verified' instead of 'verification_status' ##
        const query = 'SELECT user_id, full_name, email, role, password_hash, is_verified FROM users WHERE email = $1';
        const { rows } = await db.query(query, [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // 3. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // 4. ## FIX: Check 'is_verified' boolean status ##
        if (user.is_verified === false) { // or !user.is_verified
            return res.status(403).json({ message: "Your account is awaiting admin approval." });
        }
        
        // This handles other potential states, though we only use true/false
        if (user.is_verified !== true) {
             return res.status(403).json({ message: "This account is not active. Please contact support." });
        }
        
        // 5. Create JWT payload
        const payload = {
            user_id: user.user_id,
            role: user.role
        };

        // 6. Sign the token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        // 7. Send the response
        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user.user_id,
                fullName: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        next(error); // Pass error to global handler
    }
};