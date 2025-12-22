import json
import pickle
import numpy as np
from typing import Tuple
from sqlalchemy.orm import Session
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder

from service.intent_service import IntentService
from config.settings import get_settings
from utils.nlp_utils import preprocess_text


settings = get_settings()


class TrainingService:
    """Service for training the LSTM model."""
    
    def __init__(self, db: Session):
        self.db = db
        self.intent_service = IntentService(db)
    
    def train_model(self, epochs: int = 50) -> Tuple[bool, str]:
        """
        Train LSTM model using data from database.
        Returns (success, message).
        """
        try:
            # Get training data from database
            sentences, labels = self.intent_service.get_training_data()
            
            if len(sentences) == 0:
                return False, "No training data found in database. Please add intents first."
            
            if len(set(labels)) < 2:
                return False, "Need at least 2 different intents for training."
            
            # Preprocess sentences
            print(f"\n[NLP] Starting preprocessing for {len(sentences)} sentences...")
            processed_sentences = []
            for i, s in enumerate(sentences):
                processed = preprocess_text(s)
                processed_sentences.append(processed)
                print(f"[NLP] Processing: '{s}' -> '{processed}'")
            sentences = processed_sentences
            print("[NLP] Preprocessing completed.\n")
            
            # Encode labels
            encoder = LabelEncoder()
            encoded_labels = encoder.fit_transform(labels)
            
            # Tokenize
            tokenizer = Tokenizer()
            tokenizer.fit_on_texts(sentences)
            sequences = tokenizer.texts_to_sequences(sentences)
            padded = pad_sequences(sequences, maxlen=20)
            
            # Build model
            model = Sequential()
            model.add(Embedding(len(tokenizer.word_index) + 1, 16, input_length=padded.shape[1]))
            model.add(LSTM(16))
            model.add(Dense(len(set(labels)), activation='softmax'))
            
            model.compile(
                loss='sparse_categorical_crossentropy',
                optimizer='adam',
                metrics=['accuracy']
            )
            
            # Train
            history = model.fit(padded, encoded_labels, epochs=epochs, verbose=1)
            
            # Save model and artifacts
            model.save(settings.MODEL_PATH)
            pickle.dump(tokenizer, open(settings.TOKENIZER_PATH, 'wb'))
            pickle.dump(encoder, open(settings.ENCODER_PATH, 'wb'))
            
            # Get final accuracy
            final_accuracy = history.history['accuracy'][-1] * 100
            
            # Update is_new_data to False for all chat logs
            from schema.models import ChatLog
            self.db.query(ChatLog).filter(ChatLog.is_new_data == True).update({ChatLog.is_new_data: False})
            self.db.commit()
            
            return True, f"Model trained successfully! Final accuracy: {final_accuracy:.2f}%"
            
        except Exception as e:
            return False, f"Training failed: {str(e)}"
    
    def export_dataset_to_json(self) -> Tuple[bool, str]:
        """Export database intents to JSON file."""
        try:
            data = self.intent_service.export_to_json()
            
            with open(settings.DATASET_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            return True, f"Dataset exported to {settings.DATASET_PATH}"
        except Exception as e:
            return False, f"Export failed: {str(e)}"
