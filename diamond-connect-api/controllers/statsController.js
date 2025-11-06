const db = require('../db');

exports.getSummary = async (req, res, next) => {
    const { user_id, role } = req.user;
    try {
        let stats = {};
        if (role === 'broker') {
            const demandsTodayQuery = `SELECT COUNT(*) FROM demands WHERE created_at >= NOW() - interval '24 hours'`;
            const handsRaisedQuery = `SELECT COUNT(*) FROM demand_interests WHERE broker_id = $1`;
            const pointsQuery = `SELECT reputation_points FROM users WHERE user_id = $1`;
            
            const [demandsTodayRes, handsRaisedRes, pointsRes] = await Promise.all([
                db.query(demandsTodayQuery),
                db.query(handsRaisedQuery, [user_id]),
                db.query(pointsQuery, [user_id])
            ]);
            stats = {
                stat1: { value: parseInt(demandsTodayRes.rows[0].count, 10), label: 'New Demands Today' },
                stat2: { value: parseInt(handsRaisedRes.rows[0].count, 10), label: 'Hands Raised' },
                stat3: { value: pointsRes.rows.length > 0 ? pointsRes.rows[0].reputation_points : 0, label: 'Reputation Points' }
            };
        } else if (role === 'trader') {
            const activeDemandsQuery = `SELECT COUNT(*) FROM demands WHERE trader_id = $1 AND status = 'active'`;
            const newInterestsQuery = `SELECT COUNT(di.interest_id) FROM demand_interests di JOIN demands d ON di.demand_id = d.demand_id WHERE d.trader_id = $1`;
            const [activeDemandsRes, newInterestsRes] = await Promise.all([
                db.query(activeDemandsQuery, [user_id]),
                db.query(newInterestsQuery, [user_id])
            ]);
            stats = {
                stat1: { value: parseInt(activeDemandsRes.rows[0].count, 10), label: 'Active Demands' },
                stat2: { value: parseInt(newInterestsRes.rows[0].count, 10), label: 'New Interests' }
            };
        }
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};

exports.getAdminSummary = async (req, res, next) => {
    try {
        const totalUsersQuery = `SELECT COUNT(*) FROM users WHERE role != 'admin'`;
        const activeListingsQuery = `SELECT COUNT(*) FROM listings WHERE status = 'available'`;
        const activeDemandsQuery = `SELECT COUNT(*) FROM demands WHERE status = 'active'`;
        const newsArticlesQuery = `SELECT COUNT(*) FROM news`;

        const [usersRes, listingsRes, demandsRes, newsRes] = await Promise.all([
            db.query(totalUsersQuery),
            db.query(activeListingsQuery),
            db.query(activeDemandsQuery),
            db.query(newsArticlesQuery)
        ]);

        const summary = {
            totalUsers: parseInt(usersRes.rows[0].count, 10),
            activeListings: parseInt(listingsRes.rows[0].count, 10),
            activeDemands: parseInt(demandsRes.rows[0].count, 10),
            newsArticles: parseInt(newsRes.rows[0].count, 10)
        };
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

exports.getUserGrowthChartData = async (req, res, next) => {
    try {
        const query = `
            SELECT DATE_TRUNC('day', created_at)::DATE AS date, COUNT(user_id) AS count
            FROM users
            WHERE created_at > NOW() - INTERVAL '7 days' AND role != 'admin'
            GROUP BY date
            ORDER BY date ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
};