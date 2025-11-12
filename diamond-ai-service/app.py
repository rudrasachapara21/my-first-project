import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import os # <-- Correctly imported OS

# Initialize the Flask app
app = Flask(__name__)
# Allow all origins for now, or you can restrict it
CORS(app) 

# Load the trained model
try:
    with open('diamond_model.pkl', 'rb') as model_file:
        model = pickle.load(model_file)
    print("AI model loaded successfully.")
except FileNotFoundError:
    print("Error: 'diamond_model.pkl' not found.")
    print("Please run 'train.py' first to create the model.")
    # Don't exit, let Render handle it
    model = None

@app.route('/')
def home():
    return "Diamond AI Pricing Service is running."

# ## --- THIS IS THE NEW HEALTH ROUTE --- ##
# This is a "cheap" route for UptimeRobot to hit.
# It doesn't run the model, so it won't get rate-limited.
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200
# ## --- END OF NEW ROUTE --- ##

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
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
    # Render provides its own port via the PORT env variable.
    port = int(os.environ.get('PORT', 5002))
    # Host must be '0.0.0.0' to be reachable in Render
    app.run(host='0.0.0.0', port=port, debug=False)