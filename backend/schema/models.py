from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base


class Intent(Base):
    """Intent table - stores intent tags."""
    __tablename__ = "intents"
    
    id = Column(Integer, primary_key=True, index=True)
    tag = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patterns = relationship("Pattern", back_populates="intent", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="intent", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Intent(id={self.id}, tag='{self.tag}')>"


class Pattern(Base):
    """Pattern table - stores patterns for each intent."""
    __tablename__ = "patterns"
    
    id = Column(Integer, primary_key=True, index=True)
    intent_id = Column(Integer, ForeignKey("intents.id", ondelete="CASCADE"), nullable=False)
    pattern_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    intent = relationship("Intent", back_populates="patterns")
    
    def __repr__(self):
        return f"<Pattern(id={self.id}, text='{self.pattern_text[:30]}...')>"


class Response(Base):
    """Response table - stores responses for each intent."""
    __tablename__ = "responses"
    
    id = Column(Integer, primary_key=True, index=True)
    intent_id = Column(Integer, ForeignKey("intents.id", ondelete="CASCADE"), nullable=False)
    response_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    intent = relationship("Intent", back_populates="responses")
    
    def __repr__(self):
        return f"<Response(id={self.id}, text='{self.response_text[:30]}...')>"


class ChatLog(Base):
    """ChatLog table - stores all chat interactions."""
    __tablename__ = "chat_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_message = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=False)
    intent_tag = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ChatLog(id={self.id}, intent='{self.intent_tag}')>"
