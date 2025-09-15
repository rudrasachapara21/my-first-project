// controllers/usersController.js
const db = require('../db');

exports.getAllUsers = async (req, res) => {
    try {
        const query = "SELECT user_id, full_name, email, phone_number, role FROM users WHERE role != 'admin' ORDER BY created_at DESC";
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // This complex query ensures we delete related data from other tables before deleting the user
        await db.query('DELETE FROM demand_interests WHERE broker_id = $1', [id]);
        await db.query('DELETE FROM listing_interests WHERE interested_user_id = $1', [id]);
        await db.query('DELETE FROM demands WHERE trader_id = $1', [id]);
        await db.query('DELETE FROM listings WHERE trader_id = $1', [id]);
        
        const deleteQuery = 'DELETE FROM users WHERE user_id = $1 RETURNING user_id';
        const result = await db.query(deleteQuery, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
