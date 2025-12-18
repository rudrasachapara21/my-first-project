import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import zipfile

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

# --- ZIP FILE HANDLING ---
# If the model file doesn't exist but the zip does, extract it!
model_filename = 'diamond_model.pkl'
zip_filename = 'diamond_model.zip'

if not os.path.exists(model_filename) and os.path.exists(zip_filename):
    print(f"Extracting {zip_filename}...")
    try:
        with zipfile.ZipFile(zip_filename, 'r') as zip_ref:
            zip_ref.extractall('.')
        print("Extraction complete.")
    except Exception as e:
        print(f"Error extracting zip file: {e}")

# Load the trained model
try:
    with open(model_filename, 'rb') as model_file:
        model = pickle.load(model_file)
    print("AI model loaded successfully.")
except FileNotFoundError:
    print(f"Error: '{model_filename}' not found. Prediction will fail.")
    model = None

@app.route('/')
def home():
    return "Diamond AI Pricing Service is running."

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        print("Prediction error: Model is not loaded.")
        return jsonify({'error': 'Model not loaded'}), 500

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
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)