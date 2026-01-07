const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

exports.getPriceEstimate = async (req, res) => {
    const { carat, color, clarity, cut } = req.body;

    // 1. Basic Validation
    if (!carat || !color || !clarity || !cut) {
        return res.status(400).json({ message: 'All diamond details are required.' });
    }

    // 2. Check if API URL is set
    if (!AI_SERVICE_URL) {
        console.error("AI_SERVICE_URL is not set in environment variables.");
        return res.status(503).json({ message: "The AI pricing service is not configured." });
    }

    try {
        const caratValue = parseFloat(carat);
        if (isNaN(caratValue) || caratValue <= 0) {
            return res.status(400).json({ message: 'Please enter a valid carat weight.' });
        }

        // --- THE FIX IS HERE ---
        // 1. Remove trailing slash if present
        let cleanBaseUrl = AI_SERVICE_URL.replace(/\/$/, ""); 
        
        // 2. Remove '/predict' from the end if it's already there (to prevent double /predict/predict)
        if (cleanBaseUrl.endsWith('/predict')) {
            cleanBaseUrl = cleanBaseUrl.replace('/predict', '');
        }

        // 3. Now safely add exactly one '/predict'
        const targetUrl = `${cleanBaseUrl}/predict`;

        console.log(`Sending request to AI Service: ${targetUrl}`); // Debug log

        const aiResponse = await axios.post(targetUrl, {
            carat: caratValue,
            color,
            clarity,
            cut
        });

        res.json({ estimated_price: aiResponse.data.estimated_price });

    } catch (error) {
        // Detailed error logging
        if (error.response) {
            console.error(`AI Error (${error.response.status}):`, error.response.data);
            // Pass the specific error message from the AI service if available
            return res.status(error.response.status).json(error.response.data);
        } else {
            console.error("AI Pricing error:", error.message);
        }

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ message: "The AI pricing service is offline." });
        }
        res.status(500).json({ message: "Server error during price estimation." });
    }
};