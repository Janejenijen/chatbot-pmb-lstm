from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message to process")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Bot response")
    intent: Optional[str] = Field(None, description="Detected intent tag")
    confidence: Optional[float] = Field(None, description="Prediction confidence score")


class ChatLogResponse(BaseModel):
    id: int
    user_message: str
    bot_response: str
    intent_tag: Optional[str]
    confidence: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    total: int
    logs: list[ChatLogResponse]
