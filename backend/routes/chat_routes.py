from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from config.database import get_db
from controller.chat_controller import ChatController
from schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse


router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
def chat(chat_request: ChatRequest, db: Session = Depends(get_db)):
    """
    Send a message and receive a chatbot response.
    
    - The message is processed by the LSTM model to detect intent
    - The response is fetched from the database based on detected intent
    - The conversation is automatically logged to the database
    """
    controller = ChatController(db)
    return controller.process_chat(chat_request)


@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history(
    limit: int = Query(default=100, ge=1, le=1000, description="Number of records to return"),
    offset: int = Query(default=0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db)
):
    """
    Get chat history with pagination.
    
    - Returns most recent conversations first
    - Use limit and offset for pagination
    """
    controller = ChatController(db)
    controller = ChatController(db)
    return controller.get_chat_history(limit=limit, offset=offset)

@router.get("/new-data")
def get_new_data_candidates(db: Session = Depends(get_db)):
    """
    Get all new user questions that haven't been trained yet.
    """
    controller = ChatController(db)
    return controller.get_new_data()
