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
ZIP_PATH = os.path.join(BASE_DIR, 'diamond_model.zip')

print(f"--- SERVER STARTUP ---")
print(f"Running in directory: {BASE_DIR}")

# --- STEP 1: HANDLE ZIP FILE ---
if os.path.exists(ZIP_PATH):
    print(f"Found zip file at {ZIP_PATH}. Extracting...")
    try:
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            # Debug: Print what is inside so we know exactly
            print(f"Files inside zip: {zip_ref.namelist()}")
            zip_ref.extractall(BASE_DIR)
        print("Extraction complete.")
    except Exception as e:
        print(f"Zip extraction note: {e}")

# --- STEP 2: FIND THE MODEL FILE (SMART SEARCH) ---
final_model_path = None

print("Searching for model file...")

for root, dirs, files in os.walk(BASE_DIR):
    for file in files:
        # CHECK: Does the filename contain "diamond_model"?
        # This will catch "diamond_model.pkl", "diamond_model.pkl copy", etc.
        if "diamond_model" in file and not file.endswith(".zip"):
            full_path = os.path.join(root, file)
            
            # Verify it's not a tiny system file (must be > 1KB)
            if os.path.getsize(full_path) > 1000:
                final_model_path = full_path
                print(f"✅ FOUND MODEL AT: {final_model_path}")
                break
    if final_model_path:
        break

if not final_model_path:
    print("❌ CRITICAL ERROR: Could not find any model file.")
    # Debug listing
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
    status = "Online" if model else "Offline (Model Missing)"
    return f"Diamond AI Service Status: {status}"

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