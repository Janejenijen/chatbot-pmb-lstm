from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database settings
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "mutiara_027"
    DB_NAME: str = "chatbot_pmb"
    
    # Model settings
    MODEL_PATH: str = "model/lstm_model.h5"
    TOKENIZER_PATH: str = "model/tokenizer.pkl"
    ENCODER_PATH: str = "model/label_encoder.pkl"
    DATASET_PATH: str = "dataset/intents.json"
    MAX_SEQUENCE_LENGTH: int = 20
    
    # Training hyperparameters
    BATCH_SIZE: int = 8
    VALIDATION_SPLIT: float = 0.15  # 15% for validation
    TEST_SPLIT: float = 0.15  # 15% for testing
    
    # API settings
    API_PREFIX: str = "/api"
    DEBUG: bool = True
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
