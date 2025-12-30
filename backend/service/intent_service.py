import json
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from schema.models import Intent, Pattern, Response
from schemas.intent import IntentCreate, IntentUpdate
from config.settings import get_settings


settings = get_settings()


class IntentService:
    """Service for Intent CRUD operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_intent(self, intent_data: IntentCreate) -> Intent:
        """Create a new intent with patterns and responses."""
        # Check if tag already exists
        existing = self.db.query(Intent).filter(Intent.tag == intent_data.tag).first()
        if existing:
            raise ValueError(f"Intent with tag '{intent_data.tag}' already exists")
        
        # Create intent
        intent = Intent(tag=intent_data.tag)
        self.db.add(intent)
        self.db.flush()  # Get the ID
        
        # Add patterns
        for pattern_text in intent_data.patterns:
            pattern = Pattern(intent_id=intent.id, pattern_text=pattern_text)
            self.db.add(pattern)
        
        # Add responses
        for response_text in intent_data.responses:
            response = Response(intent_id=intent.id, response_text=response_text)
            self.db.add(response)
        
        self.db.commit()
        self.db.refresh(intent)
        return intent
    
    def get_all_intents(self) -> List[Intent]:
        """Get all intents with their patterns and responses."""
        return self.db.query(Intent).all()
    
    def get_intent_by_id(self, intent_id: int) -> Optional[Intent]:
        """Get intent by ID."""
        return self.db.query(Intent).filter(Intent.id == intent_id).first()
    
    def get_intent_by_tag(self, tag: str) -> Optional[Intent]:
        """Get intent by tag."""
        return self.db.query(Intent).filter(Intent.tag == tag).first()
    
    def update_intent(self, intent_id: int, intent_data: IntentUpdate) -> Optional[Intent]:
        """Update an existing intent."""
        intent = self.get_intent_by_id(intent_id)
        if not intent:
            return None
        
        # Update tag if provided
        if intent_data.tag is not None:
            # Check if new tag conflicts with existing
            existing = self.db.query(Intent).filter(
                Intent.tag == intent_data.tag,
                Intent.id != intent_id
            ).first()
            if existing:
                raise ValueError(f"Intent with tag '{intent_data.tag}' already exists")
            intent.tag = intent_data.tag
        
        # Update patterns if provided
        if intent_data.patterns is not None:
            # Delete existing patterns
            self.db.query(Pattern).filter(Pattern.intent_id == intent_id).delete()
            # Add new patterns
            for pattern_text in intent_data.patterns:
                pattern = Pattern(intent_id=intent_id, pattern_text=pattern_text)
                self.db.add(pattern)
        
        # Update responses if provided
        if intent_data.responses is not None:
            # Delete existing responses
            self.db.query(Response).filter(Response.intent_id == intent_id).delete()
            # Add new responses
            for response_text in intent_data.responses:
                response = Response(intent_id=intent_id, response_text=response_text)
                self.db.add(response)
        
        self.db.commit()
        self.db.refresh(intent)
        return intent
    
    def delete_intent(self, intent_id: int) -> bool:
        """Delete an intent and its patterns/responses."""
        intent = self.get_intent_by_id(intent_id)
        if not intent:
            return False
        
        self.db.delete(intent)
        self.db.commit()
        return True
    
    def add_pattern(self, intent_id: int, pattern_text: str) -> Pattern:
        """Add a single pattern to an intent."""
        pattern = Pattern(intent_id=intent_id, pattern_text=pattern_text)
        self.db.add(pattern)
        self.db.commit()
        self.db.refresh(pattern)
        return pattern
    
    def sync_from_json(self) -> int:
        """Import intents from JSON file to database."""
        try:
            with open(settings.DATASET_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Dataset file not found: {settings.DATASET_PATH}")
        
        count = 0
        for intent_data in data.get('intents', []):
            tag = intent_data.get('tag')
            patterns = intent_data.get('patterns', [])
            responses = intent_data.get('responses', [])
            
            # Skip if intent already exists
            existing = self.get_intent_by_tag(tag)
            if existing:
                continue
            
            # Create new intent
            intent = Intent(tag=tag)
            self.db.add(intent)
            self.db.flush()
            
            for pattern_text in patterns:
                pattern = Pattern(intent_id=intent.id, pattern_text=pattern_text)
                self.db.add(pattern)
            
            for response_text in responses:
                response = Response(intent_id=intent.id, response_text=response_text)
                self.db.add(response)
            
            count += 1
        
        self.db.commit()
        return count
    
    def export_to_json(self) -> dict:
        """Export database intents to JSON format."""
        intents = self.get_all_intents()
        data = {"intents": []}
        
        for intent in intents:
            intent_dict = {
                "tag": intent.tag,
                "patterns": [p.pattern_text for p in intent.patterns],
                "responses": [r.response_text for r in intent.responses]
            }
            data["intents"].append(intent_dict)
        
        return data
    
    def get_training_data(self) -> tuple:
        """Get patterns and labels for training."""
        intents = self.get_all_intents()
        sentences = []
        labels = []
        
        for intent in intents:
            for pattern in intent.patterns:
                sentences.append(pattern.pattern_text)
                labels.append(intent.tag)
        
        return sentences, labels
