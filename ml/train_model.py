import pandas as pd
import numpy as np
import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# 1. Load Dataset
print("--- Loading Dataset ---")
# Ensure we use the correct path if run from project root
dataset_path = 'health_claims_dataset.csv' if os.path.exists('health_claims_dataset.csv') else 'ml/health_claims_dataset.csv'
df = pd.read_csv(dataset_path)
print(f"Loaded {len(df)} records.")

# 2. Preprocessing & Vectorization (TF-IDF)
print("\n--- Vectorizing Text (TF-IDF) ---")
# We use a bilingual approach (English + Luganda keywords)
vectorizer = TfidfVectorizer(
    stop_words='english', 
    max_features=1000, 
    ngram_range=(1, 2)
)

X = vectorizer.fit_transform(df['claim'])

# 3. Label Encoding (3 Classes)
le = LabelEncoder()
y = le.fit_transform(df['label'].str.lower())
# Classes mapping: accurate=0, inaccurate=1, uncertain=2 (depends on alphabetical order)
class_names = le.classes_
print(f"Classes identified: {class_names}")

# 4. Train Multinomial Logistic Regression Model
print("--- Training Multinomial Logistic Regression Model ---")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)

# Use 'multinomial' for 3+ classes
model = LogisticRegression(multi_class='multinomial', solver='lbfgs', max_iter=1000)
model.fit(X_train, y_train)

# 5. Evaluation
y_pred = model.predict(X_test)
print(f"Model Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=class_names))

# 6. Export for Hybrid Engine (JSON format)
print("\n--- Exporting Model for HealthGuard Hybrid Engine ---")

# We need an array of weights for EACH class to support the Native Android logic
class_weights_export = []
for i, label in enumerate(class_names):
    class_weights_export.append({
        "label": label.upper(),
        "intercept": float(model.intercept_[i]),
        "coefficients": model.coef_[i].tolist()
    })

export_data = {
    "vocabulary": vectorizer.vocabulary_,
    "idf": vectorizer.idf_.tolist(),
    "class_weights": class_weights_export
}

export_path = 'model_weights.json' if os.path.exists('model_weights.json') else 'ml/model_weights.json'
with open(export_path, 'w') as f:
    json.dump(export_data, f, indent=2)

print(f"Successfully exported: {export_path}")
print("This model is now compatible with both Native Android (Java) and Web (TS) fallbacks.")
