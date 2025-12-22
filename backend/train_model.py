"""
Manual training script for LSTM Chatbot model.
Uses proper ML methodology with train-validation-test split.

Usage:
    python train_model.py [--epochs 100]
"""

import json
import numpy as np
import pickle
import argparse
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from utils.nlp_utils import preprocess_text

# ========== CONFIGURATION ==========
DATASET_PATH = 'dataset/intents.json'
MODEL_PATH = 'model/lstm_model.h5'
TOKENIZER_PATH = 'model/tokenizer.pkl'
ENCODER_PATH = 'model/label_encoder.pkl'

MAX_SEQUENCE_LENGTH = 20
BATCH_SIZE = 8
VALIDATION_SPLIT = 0.15  # 15% for validation
TEST_SPLIT = 0.15  # 15% for testing


def load_and_preprocess_data():
    """Load dataset and preprocess text."""
    print("=" * 60)
    print("STEP 1: Loading and Preprocessing Data")
    print("=" * 60)
    
    with open(DATASET_PATH, encoding='utf-8') as f:
        data = json.load(f)
    
    sentences = []
    labels = []
    
    for intent in data['intents']:
        for pattern in intent['patterns']:
            processed = preprocess_text(pattern)
            print(f"  [{intent['tag']}] '{pattern}' -> '{processed}'")
            sentences.append(processed)
            labels.append(intent['tag'])
    
    print(f"\nTotal samples: {len(sentences)}")
    print(f"Total intents: {len(set(labels))}")
    
    return sentences, labels


def prepare_data(sentences, labels):
    """Tokenize, encode, and split data."""
    print("\n" + "=" * 60)
    print("STEP 2: Preparing Data (Tokenize, Encode, Split)")
    print("=" * 60)
    
    # Encode labels
    encoder = LabelEncoder()
    encoded_labels = encoder.fit_transform(labels)
    num_classes = len(set(labels))
    print(f"Number of classes: {num_classes}")
    print(f"Classes: {list(encoder.classes_)}")
    
    # Tokenize
    tokenizer = Tokenizer()
    tokenizer.fit_on_texts(sentences)
    sequences = tokenizer.texts_to_sequences(sentences)
    X = pad_sequences(sequences, maxlen=MAX_SEQUENCE_LENGTH)
    y = np.array(encoded_labels)
    
    print(f"Vocabulary size: {len(tokenizer.word_index)}")
    print(f"Sequence length: {MAX_SEQUENCE_LENGTH}")
    
    # ========== TRAIN-VALIDATION-TEST SPLIT ==========
    # First split: separate test set (15%)
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, 
        test_size=TEST_SPLIT, 
        random_state=42, 
        stratify=y
    )
    
    # Second split: separate validation from training
    val_ratio = VALIDATION_SPLIT / (1 - TEST_SPLIT)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, 
        test_size=val_ratio, 
        random_state=42, 
        stratify=y_temp
    )
    
    print(f"\nDataset Split:")
    print(f"  - Training:   {len(X_train)} samples ({len(X_train)/len(X)*100:.1f}%)")
    print(f"  - Validation: {len(X_val)} samples ({len(X_val)/len(X)*100:.1f}%)")
    print(f"  - Testing:    {len(X_test)} samples ({len(X_test)/len(X)*100:.1f}%)")
    
    return (X_train, y_train, X_val, y_val, X_test, y_test), tokenizer, encoder, num_classes


def build_model(vocab_size, num_classes, input_length):
    """Build LSTM model with regularization."""
    print("\n" + "=" * 60)
    print("STEP 3: Building Model")
    print("=" * 60)
    
    model = Sequential([
        Embedding(vocab_size + 1, 32, input_length=input_length),
        LSTM(32, return_sequences=False),
        Dropout(0.3),
        Dense(16, activation='relu'),
        Dropout(0.2),
        Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        loss='sparse_categorical_crossentropy',
        optimizer='adam',
        metrics=['accuracy']
    )
    
    print("\nModel Summary:")
    model.summary()
    
    return model


def train_model(model, X_train, y_train, X_val, y_val, epochs):
    """Train model with validation monitoring."""
    print("\n" + "=" * 60)
    print("STEP 4: Training Model")
    print("=" * 60)
    print(f"Epochs: {epochs}")
    print(f"Batch Size: {BATCH_SIZE}")
    print(f"Validation Split: {VALIDATION_SPLIT*100}%")
    print("-" * 60)
    
    # Early stopping to prevent overfitting
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True,
        verbose=1
    )
    
    history = model.fit(
        X_train, y_train,
        epochs=epochs,
        batch_size=BATCH_SIZE,
        validation_data=(X_val, y_val),
        callbacks=[early_stopping],
        verbose=1
    )
    
    return history


def evaluate_model(model, X_test, y_test, encoder):
    """Evaluate model on test set."""
    print("\n" + "=" * 60)
    print("STEP 5: Evaluating on Test Set")
    print("=" * 60)
    
    # Evaluate
    test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTest Loss: {test_loss:.4f}")
    print(f"Test Accuracy: {test_accuracy*100:.2f}%")
    
    # Predictions for classification report
    y_pred = model.predict(X_test, verbose=0)
    y_pred_classes = np.argmax(y_pred, axis=1)
    
    # Classification report
    print("\nClassification Report:")
    print("-" * 60)
    print(classification_report(y_test, y_pred_classes, target_names=encoder.classes_))
    
    return test_loss, test_accuracy


def save_artifacts(model, tokenizer, encoder):
    """Save model and preprocessing artifacts."""
    print("\n" + "=" * 60)
    print("STEP 6: Saving Model and Artifacts")
    print("=" * 60)
    
    model.save(MODEL_PATH)
    print(f"  Model saved to: {MODEL_PATH}")
    
    pickle.dump(tokenizer, open(TOKENIZER_PATH, 'wb'))
    print(f"  Tokenizer saved to: {TOKENIZER_PATH}")
    
    pickle.dump(encoder, open(ENCODER_PATH, 'wb'))
    print(f"  Encoder saved to: {ENCODER_PATH}")


def main(epochs=100):
    """Main training pipeline."""
    print("\n" + "=" * 60)
    print("LSTM CHATBOT MODEL TRAINING")
    print("=" * 60)
    print(f"Configuration:")
    print(f"  - Max Sequence Length: {MAX_SEQUENCE_LENGTH}")
    print(f"  - Batch Size: {BATCH_SIZE}")
    print(f"  - Validation Split: {VALIDATION_SPLIT*100}%")
    print(f"  - Test Split: {TEST_SPLIT*100}%")
    print(f"  - Epochs: {epochs}")
    
    # Step 1: Load and preprocess
    sentences, labels = load_and_preprocess_data()
    
    # Step 2: Prepare data
    data_splits, tokenizer, encoder, num_classes = prepare_data(sentences, labels)
    X_train, y_train, X_val, y_val, X_test, y_test = data_splits
    
    # Step 3: Build model
    model = build_model(len(tokenizer.word_index), num_classes, MAX_SEQUENCE_LENGTH)
    
    # Step 4: Train
    history = train_model(model, X_train, y_train, X_val, y_val, epochs)
    
    # Step 5: Evaluate
    test_loss, test_accuracy = evaluate_model(model, X_test, y_test, encoder)
    
    # Step 6: Save
    save_artifacts(model, tokenizer, encoder)
    
    # Summary
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    print(f"Final Metrics:")
    print(f"  - Training Accuracy:   {history.history['accuracy'][-1]*100:.2f}%")
    print(f"  - Validation Accuracy: {history.history['val_accuracy'][-1]*100:.2f}%")
    print(f"  - Test Accuracy:       {test_accuracy*100:.2f}%")
    print(f"  - Epochs Run:          {len(history.history['loss'])}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train LSTM Chatbot Model')
    parser.add_argument('--epochs', type=int, default=100, help='Number of training epochs (default: 100)')
    args = parser.parse_args()
    
    main(epochs=args.epochs)
