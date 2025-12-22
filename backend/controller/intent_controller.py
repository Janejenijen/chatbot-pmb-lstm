from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from service.intent_service import IntentService
from service.training_service import TrainingService
from schemas.intent import IntentCreate, IntentUpdate, IntentResponse, IntentListResponse


class IntentController:
    """Controller for intent management operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.intent_service = IntentService(db)
        self.training_service = TrainingService(db)
    
    def create_intent(self, intent_data: IntentCreate) -> IntentResponse:
        """Create a new intent."""
        try:
            intent = self.intent_service.create_intent(intent_data)
            return intent
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    def get_all_intents(self) -> List[IntentListResponse]:
        """Get all intents with pattern/response counts."""
        intents = self.intent_service.get_all_intents()
        result = []
        for intent in intents:
            result.append({
                "id": intent.id,
                "tag": intent.tag,
                "pattern_count": len(intent.patterns),
                "response_count": len(intent.responses)
            })
        return result
    
    def get_intent_by_id(self, intent_id: int) -> IntentResponse:
        """Get intent by ID with full details."""
        intent = self.intent_service.get_intent_by_id(intent_id)
        if not intent:
            raise HTTPException(status_code=404, detail=f"Intent with id {intent_id} not found")
        return intent
    
    def update_intent(self, intent_id: int, intent_data: IntentUpdate) -> IntentResponse:
        """Update an existing intent."""
        try:
            intent = self.intent_service.update_intent(intent_id, intent_data)
            if not intent:
                raise HTTPException(status_code=404, detail=f"Intent with id {intent_id} not found")
            return intent
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    def delete_intent(self, intent_id: int) -> dict:
        """Delete an intent."""
        success = self.intent_service.delete_intent(intent_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Intent with id {intent_id} not found")
        return {"message": f"Intent {intent_id} deleted successfully"}
    
    def sync_from_json(self) -> dict:
        """Sync intents from JSON file."""
        try:
            count = self.intent_service.sync_from_json()
            return {"message": f"Synced {count} new intents from JSON file"}
        except FileNotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))
    
    def retrain_model(self, epochs: int = 100) -> dict:
        """Retrain the LSTM model with proper train-validation-test split."""
        # Reload chat service model after training
        from service.chat_service import ChatService
        
        success, message, metrics = self.training_service.train_model(epochs=epochs)
        if not success:
            raise HTTPException(status_code=400, detail=message)
        
        # Reload the model in chat service
        ChatService.reload_model()
        
        return {
            "message": message,
            "metrics": {
                "total_samples": metrics.get("total_samples"),
                "train_samples": metrics.get("train_samples"),
                "val_samples": metrics.get("val_samples"),
                "test_samples": metrics.get("test_samples"),
                "epochs_run": metrics.get("epochs_run"),
                "train_accuracy": round(metrics.get("train_accuracy", 0) * 100, 2),
                "val_accuracy": round(metrics.get("val_accuracy", 0) * 100, 2),
                "test_accuracy": round(metrics.get("test_accuracy", 0) * 100, 2),
            }
        }
    
    def export_to_json(self) -> dict:
        """Export intents to JSON file."""
        success, message = self.training_service.export_dataset_to_json()
        if not success:
            raise HTTPException(status_code=500, detail=message)
        return {"message": message}
