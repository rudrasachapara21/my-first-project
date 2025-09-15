// controllers/pricingController.js
const { calculatePrice } = require('../services/pricingService'); // 1. Import the new service

exports.getPriceEstimate = async (req, res) => {
    // 2. We now get more details from the frontend
    const { carat, color, clarity, cut, shape } = req.body;

    if (!carat || !color || !clarity || !cut || !shape) {
        return res.status(400).json({ message: 'All diamond details are required.' });
    }

    try {
        const caratValue = parseFloat(carat);
        if (isNaN(caratValue) || caratValue <= 0) {
            return res.status(400).json({ message: 'Please enter a valid carat weight.' });
        }
        
        // 3. Use the new service to calculate a consistent price
        const finalPrice = calculatePrice({ carat: caratValue, color, clarity, cut, shape });
        
        res.json({ estimatedPrice: finalPrice });

    } catch (error) {
        console.error("Pricing error:", error);
        res.status(500).json({ message: "Server error during price estimation." });
    }
};