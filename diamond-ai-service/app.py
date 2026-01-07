import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pickle
import pdfplumber
import re
import logging
from sklearn.ensemble import RandomForestRegressor

# --- CONFIGURATION ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, 'diamonds.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'diamond_model.pkl')

# --- 1. INTELLIGENT MAPPINGS (Text -> Numbers) ---
# Used for both Training (CSV) and Prediction (PDF/Manual)
CUT_MAP = {'Fair': 0, 'Good': 1, 'Very Good': 2, 'Premium': 3, 'Ideal': 4, 'Excellent': 4}
COLOR_MAP = {'J': 0, 'I': 1, 'H': 2, 'G': 3, 'F': 4, 'E': 5, 'D': 6}
CLARITY_MAP = {'I1': 0, 'SI2': 1, 'SI1': 2, 'VS2': 3, 'VS1': 4, 'VVS2': 5, 'VVS1': 6, 'IF': 7, 'FL': 8}

# --- 2. TRAINING ENGINE (Runs on Startup) ---
def train_model_from_csv():
    """Reads diamonds.csv, cleans data, trains AI, and saves model."""
    if not os.path.exists(CSV_PATH):
        logger.warning("⚠️ diamonds.csv not found. AI will use existing model if available.")
        return

    try:
        logger.info("🔄 Retraining AI Model from diamonds.csv...")
        df = pd.read_csv(CSV_PATH)

        # Clean Strings
        df['cut'] = df['cut'].astype(str).str.strip().str.title()
        df['color'] = df['color'].astype(str).str.strip().str.upper()
        df['clarity'] = df['clarity'].astype(str).str.strip().str.upper()

        # Map Text to Numbers
        df['cut_val'] = df['cut'].map(CUT_MAP).fillna(1)
        df['color_val'] = df['color'].map(COLOR_MAP).fillna(2)
        df['clarity_val'] = df['clarity'].map(CLARITY_MAP).fillna(2)
        
        # Ensure numeric
        df['carat'] = pd.to_numeric(df['carat'], errors='coerce').fillna(0)
        df['price'] = pd.to_numeric(df['price'], errors='coerce').fillna(0)

        # Train features: Carat, Cut, Color, Clarity
        X = df[['carat', 'cut_val', 'color_val', 'clarity_val']]
        y = df['price']

        if len(X) > 0:
            new_model = RandomForestRegressor(n_estimators=50, random_state=42)
            new_model.fit(X, y)
            
            with open(MODEL_PATH, 'wb') as f:
                pickle.dump(new_model, f)
            logger.info("✅ AI Model Retrained & Saved Successfully!")
        else:
            logger.error("❌ CSV is empty. Cannot train.")

    except Exception as e:
        logger.error(f"❌ Training Failed: {e}")

# --- 3. LOAD MODEL ---
# Run training once on startup
train_model_from_csv()

model = None
try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        logger.info("✅ AI Ready for Predictions.")
    else:
        logger.error("❌ No model available.")
except Exception as e:
    logger.error(f"❌ Model Load Error: {e}")

# --- 4. PREDICTION LOGIC ---
def predict_price_logic(carat, cut_text, color_text, clarity_text):
    """Shared logic: Converts text to numbers and runs AI model."""
    if not model: return 0

    try:
        # Convert inputs to float (Safely)
        try:
            carat_val = float(carat)
        except:
            carat_val = 0.0

        cut_val = float(CUT_MAP.get(cut_text, 2))       # Default 'Very Good'
        color_val = float(COLOR_MAP.get(color_text, 3)) # Default 'G'
        clarity_val = float(CLARITY_MAP.get(clarity_text, 3)) # Default 'VS2'

        # Force DataFrame to Float (Fixes 'isnan' crash)
        features = pd.DataFrame([[
            carat_val, cut_val, color_val, clarity_val
        ]], columns=['carat', 'cut_val', 'color_val', 'clarity_val']) # Columns match training X
        
        features = features.astype(float)
        
        prediction = model.predict(features)
        return round(float(prediction[0]), 2)
    except Exception as e:
        logger.error(f"Prediction Error: {e}")
        return 0

def clean_text(text):
    if not text: return ""
    return re.sub(r'\s+', ' ', text).strip()

# --- ROUTES ---

@app.route('/')
def home():
    return "Diamond AI Service (Training + Prediction + PDF) Online"


@app.route('/health')
def health():
    """Health endpoint for orchestration / load balancers.
    Returns model_loaded flag and basic uptime info.
    """
    try:
        model_loaded = model is not None
        return jsonify({
            'status': 'ok',
            'model_loaded': model_loaded
        })
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({'status': 'error'}), 500

# ✅ ROUTE 1: MANUAL PRICING (Restored)
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        price = predict_price_logic(
            data.get('carat', 0), 
            data.get('cut', 'Ideal'), 
            data.get('color', 'G'), 
            data.get('clarity', 'VS1')
        )
        return jsonify({'estimated_price': price})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ✅ ROUTE 2: PDF SCANNER (Auto-Fill)
@app.route('/analyze-pdf', methods=['POST'])
def analyze_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    try:
        # 1. Extract Text
        text_content = ""
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                text_content += (page.extract_text() or "") + "\n"
        clean = clean_text(text_content)
        
        data = {}

        # 2. Extract Fields (Regex)
        # Report Number
        report_match = re.search(r'(?:Report\s*Number|GIA).*?(\d{8,12})', clean, re.IGNORECASE)
        data['report_number'] = report_match.group(1) if report_match else ""

        # Shape
        shapes = ['Round', 'Oval', 'Princess', 'Emerald', 'Cushion', 'Pear', 'Radiant', 'Heart', 'Marquise', 'Asscher']
        data['shape'] = 'Round'
        for shape in shapes:
            if re.search(fr'\b{shape}\b', clean, re.IGNORECASE):
                data['shape'] = shape
                break

        # Carat
        carat_match = re.search(r'(\d+\.\d{2})\s*(?:carat|ct)', clean, re.IGNORECASE)
        data['carat'] = float(carat_match.group(1)) if carat_match else 0.0

        # Color
        color_match = re.search(r'Color\s*Grade.*?\b([D-Z])\b', clean, re.IGNORECASE)
        data['color'] = color_match.group(1).upper() if color_match else "H"

        # Clarity
        clarity_match = re.search(r'\b(FL|IF|VVS1|VVS2|VS1|VS2|SI1|SI2|I1|I2)\b', clean, re.IGNORECASE)
        data['clarity'] = clarity_match.group(1).upper() if clarity_match else "SI1"
        
        # Cut
        cut_match = re.search(r'Cut\s*Grade.*?(Excellent|Very Good|Good|Fair|Ideal)', clean, re.IGNORECASE)
        raw_cut = cut_match.group(1) if cut_match else "Good"
        data['cut'] = raw_cut.title()

        # 3. Predict Price (Using shared logic)
        estimated_price = 0
        if data['carat'] > 0:
            estimated_price = predict_price_logic(data['carat'], data['cut'], data['color'], data['clarity'])

        return jsonify({"success": True, "data": {**data, "estimated_price": estimated_price}})

    except Exception as e:
        logger.error(f"PDF Analysis Error: {e}")
        return jsonify({"error": "Failed"}), 500

# ✅ ROUTE 3: FETCH CERTIFICATE (The "Old" CSV Lookup)
@app.route('/fetch-certificate', methods=['POST'])
def fetch_certificate():
    try:
        report_no = str(request.json.get('report_number', '')).strip()
        if not os.path.exists(CSV_PATH):
            return jsonify({'error': 'Database not found'}), 404
            
        df = pd.read_csv(CSV_PATH, dtype=str)
        # Find row
        match = df[df['report_no'] == report_no]
        
        if not match.empty:
            row = match.iloc[0].to_dict()
            return jsonify({
                "success": True, 
                "data": {
                    "shape": row.get('shape'),
                    "carat": float(row.get('carat', 0)),
                    "color": row.get('color'),
                    "clarity": row.get('clarity'),
                    "cut": row.get('cut'),
                    "price": float(row.get('price', 0))
                }
            })
        return jsonify({"success": False, "message": "Not found"}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port)