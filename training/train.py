import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
import tensorflow as tf
import pickle

# 1. Load data
df = pd.read_csv('health_claims.csv')

# 2. Preprocess
X = df['claim']
y = df['label']

# Label mapping
label_map = {'ACCURATE': 0, 'INACCURATE': 1, 'UNCERTAIN': 2}
y = y.map(label_map).values

# 3. Vectorize (TF-IDF)
vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
X_vec = vectorizer.fit_transform(X).toarray().astype(np.float32)

# 4. Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X_vec, y, test_size=0.2, random_state=42)

# 5. Build Keras Model (Logistic Regression equivalent)
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(500,)),
    tf.keras.layers.Dense(3, activation='softmax')
])

model.compile(optimizer='adam', 
              loss='sparse_categorical_crossentropy', 
              metrics=['accuracy'])

# 6. Train
model.fit(X_train, y_train, epochs=50, batch_size=8, verbose=1)

# 7. Evaluate
loss, acc = model.evaluate(X_test, y_test, verbose=0)
print(f"Test Accuracy: {acc:.4f}")

# 8. Export to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

with open('model.tflite', 'wb') as f:
    f.write(tflite_model)

# 9. Save Vocab
vocab = vectorizer.get_feature_names_out()
with open('vocab.txt', 'w') as f:
    for word in vocab:
        f.write(f"{word}\n")

print("Export complete. model.tflite and vocab.txt saved.")
