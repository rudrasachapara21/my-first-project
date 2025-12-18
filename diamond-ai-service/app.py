import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import zipfile
import glob

app = Flask(__name__)
CORS(app)

# --- UNIVERSAL PATH SETUP ---
# This gets the absolute path to the folder where app.py is located.
# It works on Mac, Windows, and Render, no matter where you run the command from.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Define expected paths
ZIP_PATH = os.path.join(BASE_DIR, 'diamond_model.zip')
DEFAULT_MODEL_PATH = os.path.join(BASE_DIR, 'diamond_model.pkl')

print(f"--- SERVER STARTUP ---")
print(f"Running in directory: {BASE_DIR}")

# --- STEP 1: HANDLE ZIP FILE ---
# If the zip exists, we try to extract it. 
# This handles the Render deployment where only the zip exists.
if os.path.exists(ZIP_PATH):
    print(f"Found zip file at {ZIP_PATH}. Attempting to extract...")
    try:
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(BASE_DIR)
        print("Extraction complete.")
    except Exception as e:
        print(f"Note: Zip extraction skipped or failed (might not be needed): {e}")

# --- STEP 2: FIND THE MODEL FILE ---
# We look for the standard name. If not found, we search for ANY .pkl file.
# This handles the issue where the file inside the zip is named "diamond_model.pkl copy"
final_model_path = None

if os.path.exists(DEFAULT_MODEL_PATH):
    final_model_path = DEFAULT_MODEL_PATH
else:
    print(f"Standard file '{DEFAULT_MODEL_PATH}' not found. Searching folder...")
    # Find all .pkl files in the directory
    search_pattern = os.path.join(BASE_DIR, "*.pkl")
    found_files = glob.glob(search_pattern)
    
    # Filter out weird system files (like MacOS metadata) just in case
    valid_files = [f for f in found_files if os.path.getsize(f) > 1000]
    
    if valid_files:
        final_model_path = valid_files[0]
        print(f"Found alternative model file: {final_model_path}")

# --- STEP 3: LOAD THE MODEL ---
model = None
if final_model_path:
    try:
        with open(final_model_path, 'rb') as f:
            model = pickle.load(f)
        print("✅ AI Model loaded successfully!")
    except Exception as e:
        print(f"❌ CRITICAL ERROR: Could not load the model file. Details: {e}")
else:
    print("❌ CRITICAL ERROR: No .pkl model file found in directory.")

# --- ROUTES ---
@app.route('/')
def home():
    return "Diamond AI Pricing Service is running."

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded on server. Check server logs.'}), 500

    try:
        data = request.get_json()
        
        # Ensure inputs are correct types
        features = {
            'carat': float(data['carat']),
            'cut': data['cut'],
            'color': data['color'],
            'clarity': data['clarity']
        }
        
        # Create DataFrame for the model
        input_df = pd.DataFrame([features])
        
        # Predict
        prediction = model.predict(input_df)
        estimated_price = round(prediction[0], 2)
        
        return jsonify({'estimated_price': estimated_price})
        
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': 'Invalid input data or model error'}), 400

if __name__ == '__main__':
    # Render sets the PORT env variable. Local uses 5002 (or whatever you prefer).
    port = int(os.environ.get('PORT', 5002))
    print(f"🚀 Starting server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)