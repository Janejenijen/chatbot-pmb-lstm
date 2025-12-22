from typing import List
from sqlalchemy.orm import Session

from service.chat_service import ChatService
from service.intent_service import IntentService
from schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse, ChatLogResponse, AssignIntentRequest


class ChatController:
    """Controller for chat operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.chat_service = ChatService(db)
        self.intent_service = IntentService(db)
        
    def assign_to_intent(self, request: AssignIntentRequest):
        """Assign a chat log to an intent as a pattern."""
        # 1. Add pattern to intent
        self.intent_service.add_pattern(request.intent_id, request.pattern_text)
        
        # 2. Mark log as processed
        self.chat_service.mark_as_processed(request.log_id)
        
        return {"message": "Data assigned successfully"}
    
    def process_chat(self, chat_request: ChatRequest) -> ChatResponse:
        """
        Process a chat message.
        - Predicts intent using LSTM
        - Gets response from database
        - Saves chat log to database
        - Returns response with intent info
        """
        response, intent, confidence = self.chat_service.chat(chat_request.message)
        
        return ChatResponse(
            reply=response,
            intent=intent,
            confidence=confidence
        )
    
    def get_chat_history(self, limit: int = 100, offset: int = 0) -> ChatHistoryResponse:
        """Get chat history with pagination."""
        logs, total = self.chat_service.get_chat_history(limit=limit, offset=offset)
        
        return ChatHistoryResponse(
            total=total,
            logs=[
                ChatLogResponse(
                    id=log.id,
                    user_message=log.user_message,
                    bot_response=log.bot_response,
                    intent_tag=log.intent_tag,
                    confidence=log.confidence,
                    created_at=log.created_at
                )
                for log in logs
            ]
        )
        
    def get_new_data(self):
        """Get new data candidates."""
        logs = self.chat_service.get_new_data_candidates()
        return [
            {
                "id": log.id,
                "user_message": log.user_message,
                "predicted_intent": log.intent_tag,
                "confidence": log.confidence,
                "created_at": log.created_at
            }
            for log in logs
        ]
