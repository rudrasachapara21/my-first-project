const db = require('../db.js');

// Create a new demand
exports.createDemand = async (req, res) => {
  const { details } = req.body;
  const traderId = req.user.userId;

  if (!details || typeof details !== 'object') {
    return res.status(400).json({ message: 'Demand details must be a valid object' });
  }

  try {
    const detailsJsonString = JSON.stringify(details);
    const newDemandQuery = `
      INSERT INTO demands (trader_id, diamond_details, status)
      VALUES ($1, $2, 'active')
      RETURNING *
    `;
    const { rows } = await db.query(newDemandQuery, [traderId, detailsJsonString]);
    res.status(201).json({ message: 'Demand created successfully!', demand: rows[0] });
  } catch (error) {
    console.error('Create demand error:', error);
    res.status(500).json({ message: 'Server error during demand creation' });
  }
};

// Get all active demands for brokers
exports.getAllDemands = async (req, res) => {
  const brokerId = req.user.userId;
  try {
    // This query gets all demands and also checks if the current broker has shown interest
    const query = `
      SELECT 
        d.demand_id, d.diamond_details, d.status,
        u.full_name as user_name,
        (SELECT COUNT(*) FROM demand_interests di WHERE di.demand_id = d.demand_id) as interest_count,
        EXISTS(SELECT 1 FROM demand_interests di WHERE di.demand_id = d.demand_id AND di.broker_id = $1) as "currentUserInterested"
      FROM demands d
      JOIN users u ON d.trader_id = u.user_id
      WHERE d.status = 'active'
      ORDER BY d.created_at DESC;
    `;
    const { rows } = await db.query(query, [brokerId]);
    res.json(rows);
  } catch (error) {
    console.error('Get all demands error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all demands created by the logged-in trader
exports.getMyDemands = async (req, res) => {
  const traderId = req.user.userId;
  try {
    const query = `
      SELECT 
        d.demand_id, d.diamond_details, d.status,
        (SELECT COUNT(*) FROM demand_interests di WHERE di.demand_id = d.demand_id) as interest_count
      FROM demands d
      WHERE d.trader_id = $1
      ORDER BY d.created_at DESC;
    `;
    const { rows } = await db.query(query, [traderId]);
    res.json(rows);
  } catch (error) {
    console.error('Get my demands error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single demand by its ID
exports.getDemandById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM demands WHERE demand_id = $1';
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Demand not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get demand by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a demand
exports.deleteDemand = async (req, res) => {
  const { id } = req.params;
  const traderId = req.user.userId;
  try {
    // First, verify the user owns the demand
    const verifyQuery = 'SELECT trader_id FROM demands WHERE demand_id = $1';
    const verifyResult = await db.query(verifyQuery, [id]);
    if (verifyResult.rows.length === 0 || verifyResult.rows[0].trader_id !== traderId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this demand' });
    }
    // If verification passes, delete it
    await db.query('DELETE FROM demands WHERE demand_id = $1', [id]);
    res.json({ message: 'Demand deleted successfully' });
  } catch (error) {
    console.error('Delete demand error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Allow a broker to show interest in a demand
exports.raiseHandOnDemand = async (req, res) => {
  const { id: demandId } = req.params;
  const brokerId = req.user.userId;
  try {
    // Check for existing interest to prevent duplicates
    const existingInterest = await db.query(
      'SELECT * FROM demand_interests WHERE demand_id = $1 AND broker_id = $2',
      [demandId, brokerId]
    );
    if (existingInterest.rows.length > 0) {
      return res.status(409).json({ message: 'You have already shown interest in this demand' });
    }
    // If no interest exists, insert a new record
    const query = 'INSERT INTO demand_interests (demand_id, broker_id) VALUES ($1, $2) RETURNING *';
    const { rows } = await db.query(query, [demandId, brokerId]);
    res.status(201).json({ message: 'Interest registered successfully', interest: rows[0] });
  } catch (error) {
    console.error('Raise hand error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all brokers interested in a demand
exports.getDemandInterests = async (req, res) => {
  const { id: demandId } = req.params;
  const traderId = req.user.userId;
  try {
    // Verify the logged-in user owns the demand before showing interested brokers
    const verifyQuery = 'SELECT trader_id FROM demands WHERE demand_id = $1 AND trader_id = $2';
    const verifyResult = await db.query(verifyQuery, [demandId, traderId]);
    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden: You do not own this demand' });
    }
    // If verification passes, get the interested brokers
    const query = `
      SELECT u.user_id, u.full_name, u.email, u.company_name
      FROM users u
      JOIN demand_interests di ON u.user_id = di.broker_id
      WHERE di.demand_id = $1;
    `;
    const { rows } = await db.query(query, [demandId]);
    res.json(rows);
  } catch (error) {
    console.error('Get demand interests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};