const axios = require('axios');

// --- THIS IS THE DEPLOYMENT-READY CODE ---
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

exports.getPriceEstimate = async (req, res) => {
    const { carat, color, clarity, cut } = req.body;

    if (!carat || !color || !clarity || !cut) {
        return res.status(400).json({ message: 'All diamond details are required.' });
    }

    if (!AI_SERVICE_URL) {
        console.error("AI_SERVICE_URL is not set in environment variables.");
        return res.status(503).json({ message: "The AI pricing service is not configured." });
    }

    try {
        const caratValue = parseFloat(carat);
        if (isNaN(caratValue) || caratValue <= 0) {
            return res.status(400).json({ message: 'Please enter a valid carat weight.' });
        }

        const aiResponse = await axios.post(AI_SERVICE_URL, {
            carat: caratValue,
            color,
            clarity,
            cut
        });

        res.json({ estimated_price: aiResponse.data.estimated_price });

    } catch (error) {
        console.error("AI Pricing error:", error.message);
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ message: "The AI pricing service is offline." });
        }
        res.status(500).json({ message: "Server error during price estimation." });
    }
};