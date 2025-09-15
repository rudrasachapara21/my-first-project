// controllers/profileController.js
const db = require('../db');

exports.getUserProfile = async (req, res) => {
    try {
        const userProfile = await db.query(
            "SELECT user_id, full_name, email, phone_number, role, office_name, office_address, gst_number, photo_url FROM users WHERE user_id = $1",
            [req.user.userId]
        );
        if (userProfile.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json(userProfile.rows[0]);
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

exports.updateUserProfile = async (req, res) => {
    const { full_name, office_name, phone_number, office_address, gst_number } = req.body;
    const userId = req.user.userId;

    try {
        // --- THIS IS THE FIX ---
        // We will build the query dynamically based on whether a photo was uploaded.
        
        let query;
        let values;

        if (req.file) {
            // If a new file was uploaded, update the photo_url column.
            query = `
                UPDATE users SET 
                    full_name = $1, office_name = $2, phone_number = $3, 
                    office_address = $4, gst_number = $5, photo_url = $6 
                WHERE user_id = $7 RETURNING user_id, full_name, email, role, photo_url`;
            values = [full_name, office_name, phone_number, office_address, gst_number, req.file.path, userId];
        } else {
            // If no new file was uploaded, do NOT update the photo_url column.
            query = `
                UPDATE users SET 
                    full_name = $1, office_name = $2, phone_number = $3, 
                    office_address = $4, gst_number = $5 
                WHERE user_id = $6 RETURNING user_id, full_name, email, role, photo_url`;
            values = [full_name, office_name, phone_number, office_address, gst_number, userId];
        }
        
        const { rows } = await db.query(query, values);

        res.json({
            message: "Profile updated successfully!",
            user: rows[0]
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Server error." });
    }
};