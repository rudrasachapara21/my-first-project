import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OrdinalEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import pickle

print("Starting model training...")

# 1. Load the dataset
try:
    data = pd.read_csv('diamonds.csv')
except FileNotFoundError:
    print("Error: 'diamonds.csv' not found.")
    print("Please download it from Kaggle and place it in this folder.")
    exit()

# 2. Define features (X) and target (y)
target = 'price'
features = ['carat', 'cut', 'color', 'clarity']

# Keep only the columns we need
data = data[features + [target]]

# Drop any rows with missing values
data = data.dropna()

X = data[features]
y = data[target]

# 3. Define the correct order for categorical features
cut_order = ['Fair', 'Good', 'Very Good', 'Premium', 'Ideal']
color_order = ['J', 'I', 'H', 'G', 'F', 'E', 'D']
clarity_order = ['I1', 'SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'IF']

# 4. Create a preprocessing pipeline
categorical_transformer = Pipeline(steps=[
    ('ordinal', OrdinalEncoder(categories=[cut_order, color_order, clarity_order]))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', categorical_transformer, ['cut', 'color', 'clarity']),
        ('num', 'passthrough', ['carat'])
    ],
    remainder='passthrough',
    verbose_feature_names_out=False
)

# 5. Define the model
model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)

# 6. Create the full pipeline
pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('model', model)
])

# 7. Train the model
print("Training the model... (This may take a minute)")
pipeline.fit(X, y)
print("Training complete.")

# 8. Save the trained model
model_filename = 'diamond_model.pkl'
with open(model_filename, 'wb') as file:
    pickle.dump(pipeline, file)

print(f"Model successfully saved to '{model_filename}'")