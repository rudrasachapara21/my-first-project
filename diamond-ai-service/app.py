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
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Define expected paths
ZIP_PATH = os.path.join(BASE_DIR, 'diamond_model.zip')
DEFAULT_MODEL_PATH = os.path.join(BASE_DIR, 'diamond_model.pkl')

print(f"--- SERVER STARTUP ---")
print(f"Running in directory: {BASE_DIR}")

# --- STEP 1: HANDLE ZIP FILE ---
if os.path.exists(ZIP_PATH):
    print(f"Found zip file at {ZIP_PATH}. Attempting to extract...")
    try:
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            # Print files inside zip for debugging
            print(f"Files inside zip: {zip_ref.namelist()}")
            zip_ref.extractall(BASE_DIR)
        print("Extraction complete.")
    except Exception as e:
        print(f"Note: Zip extraction skipped or failed: {e}")

# --- STEP 2: SUPER SEARCH FOR MODEL FILE ---
# We use os.walk to look into ALL subfolders recursively
final_model_path = None

print("Searching for .pkl files in all subdirectories...")

for root, dirs, files in os.walk(BASE_DIR):
    for file in files:
        if file.endswith(".pkl") and not file.startswith("._"): # Ignore Mac hidden files
            full_path = os.path.join(root, file)
            # Check file size to avoid empty corrupt files
            if os.path.getsize(full_path) > 1000: # Bigger than 1KB
                final_model_path = full_path
                print(f"FOUND MODEL AT: {final_model_path}")
                break
    if final_model_path:
        break

if not final_model_path:
    print("❌ CRITICAL ERROR: Could not find any .pkl file in extracted folders.")
    # Debug: List all files so we can see what happened
    print("Listing all files on server:")
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            print(os.path.join(root, file))

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
    print("❌ SYSTEM FAILURE: No model available.")

# --- ROUTES ---
@app.route('/')
def home():
    status = "AI System Online" if model else "AI System Offline (Model Missing)"
    return f"Diamond AI Pricing Service: {status}"

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded on server.'}), 500

    try:
        data = request.get_json()
        features = {
            'carat': float(data['carat']),
            'cut': data['cut'],
            'color': data['color'],
            'clarity': data['clarity']
        }
        input_df = pd.DataFrame([features])
        prediction = model.predict(input_df)
        estimated_price = round(prediction[0], 2)
        return jsonify({'estimated_price': estimated_price})
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': 'Invalid input data'}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=False)