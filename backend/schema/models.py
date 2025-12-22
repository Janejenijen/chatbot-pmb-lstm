from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Boolean
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
    is_new_data = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ChatLog(id={self.id}, intent='{self.intent_tag}')>"


class TrainingHistory(Base):
    """TrainingHistory table - stores training run results."""
    __tablename__ = "training_history"
    
    id = Column(Integer, primary_key=True, index=True)
    trained_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Training configuration
    epochs_requested = Column(Integer, nullable=False)
    epochs_run = Column(Integer, nullable=False)
    split_ratio = Column(String(10), nullable=False)  # "70:30" or "80:20"
    batch_size = Column(Integer, nullable=False)
    
    # Sample counts
    total_samples = Column(Integer, nullable=False)
    train_samples = Column(Integer, nullable=False)
    val_samples = Column(Integer, nullable=False)
    test_samples = Column(Integer, nullable=False)
    num_classes = Column(Integer, nullable=False)
    
    # Metrics
    train_accuracy = Column(Float, nullable=False)
    val_accuracy = Column(Float, nullable=False)
    test_accuracy = Column(Float, nullable=False)
    train_loss = Column(Float, nullable=False)
    val_loss = Column(Float, nullable=False)
    test_loss = Column(Float, nullable=False)
    
    # Confusion matrix & classification report (stored as JSON strings)
    confusion_matrix = Column(Text, nullable=True)  # JSON 2D array
    classification_report = Column(Text, nullable=True)  # JSON object
    class_names = Column(Text, nullable=True)  # JSON array of class names
    
    def __repr__(self):
        return f"<TrainingHistory(id={self.id}, trained_at='{self.trained_at}', test_acc={self.test_accuracy:.2f})>"
