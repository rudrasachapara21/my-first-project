import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# Initialize the Flask app
app = Flask(__name__)
CORS(app) 

# Load the trained model
try:
    with open('diamond_model.pkl', 'rb') as model_file:
        model = pickle.load(model_file)
    print("AI model loaded successfully.")
except FileNotFoundError:
    print("Error: 'diamond_model.pkl' not found.")
    model = None

@app.route('/')
def home():
    return "Diamond AI Pricing Service is running."

# This is the "cheap" route for UptimeRobot
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

# THIS IS THE /predict ROUTE THAT IS CURRENTLY MISSING
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
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=False)