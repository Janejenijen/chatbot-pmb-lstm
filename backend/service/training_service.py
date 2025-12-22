import json
import pickle
import numpy as np
from typing import Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

from service.intent_service import IntentService
from config.settings import get_settings
from utils.nlp_utils import preprocess_text


settings = get_settings()


class TrainingService:
    """Service for training the LSTM model with proper ML methodology."""
    
    def __init__(self, db: Session):
        self.db = db
        self.intent_service = IntentService(db)
    
    def _parse_split_ratio(self, split_ratio: str) -> Tuple[float, float]:
        """Parse split ratio string like '70:30' or '80:20' into test and validation splits."""
        if split_ratio == "80:20":
            # 80% train, 20% test (we'll take 10% from train for validation)
            # So effectively: 70% train, 10% val, 20% test
            return 0.20, 0.125  # test_split, val_ratio (10% of 80% = 12.5% of remaining)
        else:  # "70:30" default
            # 70% train, 30% test (we'll take 15% from train for validation)
            # So effectively: 55% train, 15% val, 30% test
            return 0.30, 0.214  # test_split, val_ratio (15% of 70% ≈ 21.4% of remaining)
    
    def train_model(
        self, 
        epochs: int = 100, 
        split_ratio: str = "70:30"
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Train LSTM model using data from database with proper train-validation-test split.
        Returns (success, message, metrics).
        """
        try:
            # Get training data from database
            sentences, labels = self.intent_service.get_training_data()
            
            if len(sentences) == 0:
                return False, "No training data found in database. Please add intents first.", {}
            
            if len(set(labels)) < 2:
                return False, "Need at least 2 different intents for training.", {}
            
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
            num_classes = len(set(labels))
            class_names = list(encoder.classes_)
            
            # Tokenize
            tokenizer = Tokenizer()
            tokenizer.fit_on_texts(sentences)
            sequences = tokenizer.texts_to_sequences(sentences)
            X = pad_sequences(sequences, maxlen=settings.MAX_SEQUENCE_LENGTH)
            y = np.array(encoded_labels)
            
            # ========== TRAIN-VALIDATION-TEST SPLIT ==========
            test_split, val_ratio = self._parse_split_ratio(split_ratio)
            
            # First split: separate test set
            X_temp, X_test, y_temp, y_test = train_test_split(
                X, y, 
                test_size=test_split, 
                random_state=42, 
                stratify=y
            )
            
            # Second split: separate validation from training
            X_train, X_val, y_train, y_val = train_test_split(
                X_temp, y_temp, 
                test_size=val_ratio, 
                random_state=42, 
                stratify=y_temp
            )
            
            print(f"\n[SPLIT] Dataset split ({split_ratio}):")
            print(f"  - Training:   {len(X_train)} samples ({len(X_train)/len(X)*100:.1f}%)")
            print(f"  - Validation: {len(X_val)} samples ({len(X_val)/len(X)*100:.1f}%)")
            print(f"  - Testing:    {len(X_test)} samples ({len(X_test)/len(X)*100:.1f}%)")
            print(f"  - Total:      {len(X)} samples\n")
            
            # ========== BUILD MODEL ==========
            model = Sequential()
            model.add(Embedding(len(tokenizer.word_index) + 1, 32, input_length=X.shape[1]))
            model.add(LSTM(32, return_sequences=False))
            model.add(Dropout(0.3))
            model.add(Dense(16, activation='relu'))
            model.add(Dropout(0.2))
            model.add(Dense(num_classes, activation='softmax'))
            
            model.compile(
                loss='sparse_categorical_crossentropy',
                optimizer='adam',
                metrics=['accuracy']
            )
            
            # Early stopping to prevent overfitting
            early_stopping = EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True,
                verbose=1
            )
            
            # ========== TRAIN WITH VALIDATION ==========
            batch_size = settings.BATCH_SIZE
            print(f"[TRAIN] Starting training with {epochs} epochs, batch_size={batch_size}")
            history = model.fit(
                X_train, y_train,
                epochs=epochs,
                batch_size=batch_size,
                validation_data=(X_val, y_val),
                callbacks=[early_stopping],
                verbose=1
            )
            
            # ========== EVALUATE ON TEST SET ==========
            print("\n[EVAL] Evaluating on test set...")
            test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
            
            # Get predictions for classification report and confusion matrix
            y_pred = model.predict(X_test, verbose=0)
            y_pred_classes = np.argmax(y_pred, axis=1)
            
            # Confusion matrix
            conf_matrix = confusion_matrix(y_test, y_pred_classes)
            
            # Classification report
            report = classification_report(y_test, y_pred_classes, target_names=class_names, output_dict=True)
            report_str = classification_report(y_test, y_pred_classes, target_names=class_names)
            
            print("\n[EVAL] Classification Report:")
            print(report_str)
            print("\n[EVAL] Confusion Matrix:")
            print(conf_matrix)
            
            # ========== SAVE MODEL AND ARTIFACTS ==========
            model.save(settings.MODEL_PATH)
            pickle.dump(tokenizer, open(settings.TOKENIZER_PATH, 'wb'))
            pickle.dump(encoder, open(settings.ENCODER_PATH, 'wb'))
            
            # Prepare metrics
            metrics = {
                "total_samples": len(X),
                "train_samples": len(X_train),
                "val_samples": len(X_val),
                "test_samples": len(X_test),
                "num_classes": num_classes,
                "epochs_requested": epochs,
                "epochs_run": len(history.history['loss']),
                "batch_size": batch_size,
                "split_ratio": split_ratio,
                "train_accuracy": float(history.history['accuracy'][-1]),
                "train_loss": float(history.history['loss'][-1]),
                "val_accuracy": float(history.history['val_accuracy'][-1]),
                "val_loss": float(history.history['val_loss'][-1]),
                "test_accuracy": float(test_accuracy),
                "test_loss": float(test_loss),
                "confusion_matrix": conf_matrix.tolist(),
                "classification_report": report,
                "class_names": class_names
            }
            
            # ========== SAVE TO DATABASE ==========
            training_history = self._save_training_history(metrics)
            metrics["training_id"] = training_history.id
            
            # Update is_new_data to False for all chat logs
            from schema.models import ChatLog
            self.db.query(ChatLog).filter(ChatLog.is_new_data == True).update({ChatLog.is_new_data: False})
            self.db.commit()
            
            message = (
                f"Model trained successfully!\n"
                f"• Training Accuracy: {metrics['train_accuracy']*100:.2f}%\n"
                f"• Validation Accuracy: {metrics['val_accuracy']*100:.2f}%\n"
                f"• Test Accuracy: {metrics['test_accuracy']*100:.2f}%\n"
                f"• Epochs: {metrics['epochs_run']}/{epochs}\n"
                f"• Split Ratio: {split_ratio}"
            )
            
            return True, message, metrics
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return False, f"Training failed: {str(e)}", {}
    
    def _save_training_history(self, metrics: Dict[str, Any]):
        """Save training metrics to database."""
        from schema.models import TrainingHistory
        
        training_history = TrainingHistory(
            epochs_requested=metrics["epochs_requested"],
            epochs_run=metrics["epochs_run"],
            split_ratio=metrics["split_ratio"],
            batch_size=metrics["batch_size"],
            total_samples=metrics["total_samples"],
            train_samples=metrics["train_samples"],
            val_samples=metrics["val_samples"],
            test_samples=metrics["test_samples"],
            num_classes=metrics["num_classes"],
            train_accuracy=metrics["train_accuracy"],
            val_accuracy=metrics["val_accuracy"],
            test_accuracy=metrics["test_accuracy"],
            train_loss=metrics["train_loss"],
            val_loss=metrics["val_loss"],
            test_loss=metrics["test_loss"],
            confusion_matrix=json.dumps(metrics["confusion_matrix"]),
            classification_report=json.dumps(metrics["classification_report"]),
            class_names=json.dumps(metrics["class_names"])
        )
        
        self.db.add(training_history)
        self.db.commit()
        self.db.refresh(training_history)
        
        print(f"[DB] Training history saved with ID: {training_history.id}")
        return training_history
    
    def get_all_training_history(self):
        """Get all training history records."""
        from schema.models import TrainingHistory
        return self.db.query(TrainingHistory).order_by(TrainingHistory.trained_at.desc()).all()
    
    def get_training_history_by_id(self, history_id: int) -> Optional[Dict[str, Any]]:
        """Get training history by ID with parsed JSON fields."""
        from schema.models import TrainingHistory
        
        record = self.db.query(TrainingHistory).filter(TrainingHistory.id == history_id).first()
        if not record:
            return None
        
        return {
            "id": record.id,
            "trained_at": record.trained_at.isoformat() if record.trained_at else None,
            "epochs_requested": record.epochs_requested,
            "epochs_run": record.epochs_run,
            "split_ratio": record.split_ratio,
            "batch_size": record.batch_size,
            "total_samples": record.total_samples,
            "train_samples": record.train_samples,
            "val_samples": record.val_samples,
            "test_samples": record.test_samples,
            "num_classes": record.num_classes,
            "train_accuracy": record.train_accuracy,
            "val_accuracy": record.val_accuracy,
            "test_accuracy": record.test_accuracy,
            "train_loss": record.train_loss,
            "val_loss": record.val_loss,
            "test_loss": record.test_loss,
            "confusion_matrix": json.loads(record.confusion_matrix) if record.confusion_matrix else [],
            "classification_report": json.loads(record.classification_report) if record.classification_report else {},
            "class_names": json.loads(record.class_names) if record.class_names else []
        }
    
    def delete_training_history(self, history_id: int) -> bool:
        """Delete a training history record."""
        from schema.models import TrainingHistory
        
        record = self.db.query(TrainingHistory).filter(TrainingHistory.id == history_id).first()
        if not record:
            return False
        
        self.db.delete(record)
        self.db.commit()
        return True
    
    def export_dataset_to_json(self) -> Tuple[bool, str]:
        """Export database intents to JSON file."""
        try:
            data = self.intent_service.export_to_json()
            
            with open(settings.DATASET_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            return True, f"Dataset exported to {settings.DATASET_PATH}"
        except Exception as e:
            return False, f"Export failed: {str(e)}"
