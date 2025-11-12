const db = require('../db');

exports.getUserProfile = async (req, res, next) => {
    try {
        const query = `
            SELECT user_id, full_name, email, role, profile_photo_url, gst_number,
                   office_address, phone_number, office_name, office_hours
            FROM users
            WHERE user_id = $1
        `;
        const { rows } = await db.query(query, [req.user.user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Get user profile error:", error);
        next(error);
    }
};

exports.updateUserProfile = async (req, res, next) => {
    const userId = req.user.user_id;
    const fields = req.body;

    if (fields.email || fields.password) {
        return res.status(400).json({ message: "Cannot update email or password from this endpoint." });
    }

    const allowedFields = ['full_name', 'gst_number', 'office_address', 'phone_number', 'office_name', 'office_hours'];
    
    const updateFields = [];
    const values = [];
    let queryIndex = 1;

    allowedFields.forEach(field => {
        if (fields[field] !== undefined) {
            updateFields.push(`${field} = $${queryIndex++}`);
            values.push(fields[field]);
        }
    });

    if (req.file) {
        // Cloudinary provides the secure, permanent URL in 'req.file.path'
        const photoUrl = req.file.path; 
        updateFields.push(`profile_photo_url = $${queryIndex++}`);
        values.push(photoUrl);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: "No valid fields to update were provided." });
    }

    values.push(userId);

    try {
        const query = `
            UPDATE users SET ${updateFields.join(', ')}
            WHERE user_id = $${queryIndex}
            RETURNING user_id, full_name, email, role, profile_photo_url, gst_number, office_address, phone_number, office_name, office_hours
        `;

        const { rows } = await db.query(query, values);
        const updatedProfile = rows[0];

        req.io.emit('profile-updated', { userId: userId, profile: updatedProfile });

        res.status(200).json({
            message: "Profile updated successfully!",
            user: updatedProfile
        });

    // ## --- THIS IS THE FIX --- ##
    // This opening brace '{' was missing before,
    // which was causing the server to crash.
    } catch (error) { 
        console.error("Update user profile error:", error);
        next(error);
    }
};