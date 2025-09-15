// controllers/listingController.js
const db = require('../db.js');

// The logic for the POST /api/listings endpoint with file upload
exports.createListing = async (req, res) => {
  // Text fields are in req.body
  const { carat, clarity, price, color, shape, cut } = req.body;
  // The file info is in req.file
  const imagePath = req.file ? req.file.path : null; 
  const traderId = req.user.userId;

  if (!carat || !clarity || !price || !imagePath) {
    return res.status(400).json({ message: 'All fields, including image, are required' });
  }

  try {
    // Create the JSON object for diamond_details
    const diamondDetails = { carat, clarity, color, shape, cut };

    const newListingQuery = `
      INSERT INTO listings (trader_id, diamond_details, price, image_url, status)
      VALUES ($1, $2, $3, $4, 'available')
      RETURNING *
    `;
    const values = [traderId, diamondDetails, price, imagePath];
    const { rows } = await db.query(newListingQuery, values);

    res.status(201).json({
      message: 'Listing created successfully!',
      listing: rows[0],
    });

  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ message: 'Server error during listing creation' });
  }
};

// The logic for the GET /api/listings endpoint
exports.getAllListings = async (req, res) => {
  try {
    const getAllListingsQuery = `
      SELECT l.*, u.full_name as user_name
      FROM listings l
      JOIN users u ON l.trader_id = u.user_id
      WHERE l.status = 'available'
      ORDER BY l.created_at DESC
    `;
    const { rows } = await db.query(getAllListingsQuery);

    res.status(200).json(rows);

  } catch (error) {
    console.error('Get all listings error:', error);
    res.status(500).json({ message: 'Server error while fetching listings' });
  }
};

// The logic for the POST /api/listings/:id/raise-hand endpoint
exports.raiseHandOnListing = async (req, res) => {
  const { id } = req.params;
  const interestedUserId = req.user.userId;

  try {
    const listingQuery = 'SELECT * FROM listings WHERE listing_id = $1';
    const listingResult = await db.query(listingQuery, [id]);
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listingResult.rows[0].trader_id === interestedUserId) {
        return res.status(400).json({ message: 'You cannot raise a hand on your own listing' });
    }

    const raiseHandQuery = `
      INSERT INTO listing_interests (listing_id, interested_user_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const { rows } = await db.query(raiseHandQuery, [id, interestedUserId]);

    res.status(201).json({
      message: 'Successfully raised hand on the listing!',
      interest: rows[0],
    });

  } catch (error) {
    if (error.code === '23505') { // unique_violation
      return res.status(409).json({ message: 'You have already raised a hand on this listing' });
    }
    console.error('Raise hand on listing error:', error);
    res.status(500).json({ message: 'Server error while raising hand on listing' });
  }
};

// The logic for the GET /api/listings/:id/interests endpoint
exports.getListingInterests = async (req, res) => {
  const { id } = req.params;
  const traderId = req.user.userId;

  try {
    const listingQuery = 'SELECT * FROM listings WHERE listing_id = $1';
    const listingResult = await db.query(listingQuery, [id]);

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const listing = listingResult.rows[0];
    if (listing.trader_id !== traderId) {
      return res.status(403).json({ message: 'Forbidden: You are not the owner of this listing' });
    }

    const interestsQuery = `
      SELECT u.user_id, u.full_name, u.email, u.phone_number, u.office_name
      FROM users u
      JOIN listing_interests li ON u.user_id = li.interested_user_id
      WHERE li.listing_id = $1
    `;
    const { rows } = await db.query(interestsQuery, [id]);

    res.status(200).json(rows);

  } catch (error) {
    console.error('Get listing interests error:', error);
    res.status(500).json({ message: 'Server error while fetching interests' });
  }
};