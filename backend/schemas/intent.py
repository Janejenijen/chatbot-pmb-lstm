from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# Pattern schemas
class PatternBase(BaseModel):
    pattern_text: str = Field(..., min_length=1, description="Pattern text for intent matching")


class PatternCreate(PatternBase):
    pass


class PatternResponse(PatternBase):
    id: int
    intent_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Response schemas
class ResponseBase(BaseModel):
    response_text: str = Field(..., min_length=1, description="Response text for the intent")


class ResponseCreate(ResponseBase):
    pass


class ResponseResponse(ResponseBase):
    id: int
    intent_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Intent schemas
class IntentBase(BaseModel):
    tag: str = Field(..., min_length=1, max_length=100, description="Unique intent tag")


class IntentCreate(IntentBase):
    patterns: List[str] = Field(..., min_length=1, description="List of patterns for the intent")
    responses: List[str] = Field(..., min_length=1, description="List of responses for the intent")


class IntentUpdate(BaseModel):
    tag: Optional[str] = Field(None, min_length=1, max_length=100)
    patterns: Optional[List[str]] = None
    responses: Optional[List[str]] = None


class IntentResponse(IntentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    patterns: List[PatternResponse]
    responses: List[ResponseResponse]
    
    class Config:
        from_attributes = True


class IntentListResponse(IntentBase):
    id: int
    pattern_count: int
    response_count: int
    
    class Config:
        from_attributes = True
