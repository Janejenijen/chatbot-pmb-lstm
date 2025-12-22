import numpy as np
import pickle
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

from schema.models import ChatLog, Intent, Pattern
from config.settings import get_settings
from utils.nlp_utils import preprocess_text


settings = get_settings()


class ChatService:
    """Service for chat processing and LSTM prediction."""
    
    _model = None
    _tokenizer = None
    _encoder = None
    _max_len = 20
    
    def __init__(self, db: Session):
        self.db = db
        self._load_model()
    
    @classmethod
    def _load_model(cls):
        """Load LSTM model, tokenizer, and encoder (singleton pattern)."""
        if cls._model is None:
            try:
                cls._model = load_model(settings.MODEL_PATH)
                cls._tokenizer = pickle.load(open(settings.TOKENIZER_PATH, 'rb'))
                cls._encoder = pickle.load(open(settings.ENCODER_PATH, 'rb'))
            except Exception as e:
                print(f"Warning: Could not load model files: {e}")
                cls._model = None
                cls._tokenizer = None
                cls._encoder = None
    
    @classmethod
    def reload_model(cls):
        """Force reload the model (after retraining)."""
        cls._model = None
        cls._tokenizer = None
        cls._encoder = None
        cls._load_model()
    
    def predict_intent(self, message: str) -> Tuple[Optional[str], float]:
        """Predict intent from user message using LSTM model."""
        if self._model is None or self._tokenizer is None or self._encoder is None:
            return None, 0.0
        
        # Preprocess message
        processed_message = preprocess_text(message)
        print(f"[NLP-Predict] Original: '{message}' -> Processed: '{processed_message}'")
        
        # Tokenize and pad
        seq = self._tokenizer.texts_to_sequences([processed_message])
        pad = pad_sequences(seq, maxlen=self._max_len)
        
        # Predict
        pred = self._model.predict(pad, verbose=0)
        confidence = float(np.max(pred))
        tag = self._encoder.inverse_transform([np.argmax(pred)])[0]
        
        return tag, confidence
    
    def get_response(self, tag: str) -> Optional[str]:
        """Get response for a given intent tag from database."""
        intent = self.db.query(Intent).filter(Intent.tag == tag).first()
        if intent and intent.responses:
            # Return first response (can be randomized later)
            return intent.responses[0].response_text
        return None
    
    def process_message(self, message: str) -> Tuple[str, Optional[str], float]:
        """Process user message and return response with intent info."""
        # Predict intent
        tag, confidence = self.predict_intent(message)
        
        # Get response based on intent
        if tag:
            response = self.get_response(tag)
            if response:
                return response, tag, confidence
        
        # Default response if no match
        return "Maaf, saya belum memahami pertanyaan tersebut.", tag, confidence
    
    def save_chat_log(
        self, 
        user_message: str, 
        bot_response: str, 
        intent_tag: Optional[str] = None,
        confidence: Optional[float] = None,
        is_new_data: bool = True
    ) -> ChatLog:
        """Save chat interaction to database."""
        
        # Duplicate Check Logic
        # 1. Check if message already exists in trained patterns (case-insensitive)
        exists_in_patterns = self.db.query(Pattern).filter(
            Pattern.pattern_text.ilike(user_message)
        ).first() is not None
        
        # 2. Check if message already exists in new data queue (prevent duplicates in inbox)
        exists_in_queue = self.db.query(ChatLog).filter(
            ChatLog.user_message.ilike(user_message),
            ChatLog.is_new_data == True
        ).first() is not None
        
        # If exists in either, it's not "new data" for the dataset
        final_is_new_data = is_new_data and not exists_in_patterns and not exists_in_queue
        
        chat_log = ChatLog(
            user_message=user_message,
            bot_response=bot_response,
            intent_tag=intent_tag,
            confidence=confidence,
            is_new_data=final_is_new_data
        )
        self.db.add(chat_log)
        self.db.commit()
        self.db.refresh(chat_log)
        return chat_log
    
    def get_chat_history(self, limit: int = 100, offset: int = 0) -> Tuple[List[ChatLog], int]:
        """Get chat history with pagination."""
        total = self.db.query(ChatLog).count()
        logs = self.db.query(ChatLog)\
            .order_by(ChatLog.created_at.desc())\
            .offset(offset)\
            .limit(limit)\
            .all()
        return logs, total
    
    def get_new_data_candidates(self) -> List[ChatLog]:
        """Get unique chat logs marked as new data."""
        # We might want to group by user_message to be safe, but our save logic handles duplicates.
        # Just return the latest ones or all.
        return self.db.query(ChatLog)\
            .filter(ChatLog.is_new_data == True)\
            .order_by(ChatLog.created_at.desc())\
            .all()
    
    def mark_as_processed(self, log_id: int) -> bool:
        """Mark a chat log as processed (not new data)."""
        log = self.db.query(ChatLog).filter(ChatLog.id == log_id).first()
        if log:
            log.is_new_data = False
            self.db.commit()
            return True
        return False

    def chat(self, message: str) -> Tuple[str, Optional[str], float]:
        """
        Main chat function: process message, save to DB, return response.
        This is the main entry point for chat interactions.
        """
        # Process message
        response, tag, confidence = self.process_message(message)
        
        # Save to database
        self.save_chat_log(
            user_message=message,
            bot_response=response,
            intent_tag=tag,
            confidence=confidence
        )
        
        return response, tag, confidence
