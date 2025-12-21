from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from config.database import get_db
from controller.intent_controller import IntentController
from schemas.intent import IntentCreate, IntentUpdate, IntentResponse, IntentListResponse


router = APIRouter(prefix="/intents", tags=["Intents"])


@router.post("/", response_model=IntentResponse, status_code=201)
def create_intent(intent_data: IntentCreate, db: Session = Depends(get_db)):
    """
    Create a new intent with patterns and responses.
    
    - **tag**: Unique identifier for the intent
    - **patterns**: List of example user inputs
    - **responses**: List of bot responses for this intent
    """
    controller = IntentController(db)
    return controller.create_intent(intent_data)


@router.get("/", response_model=List[IntentListResponse])
def get_all_intents(db: Session = Depends(get_db)):
    """
    Get all intents with pattern and response counts.
    """
    controller = IntentController(db)
    return controller.get_all_intents()


@router.get("/{intent_id}", response_model=IntentResponse)
def get_intent(intent_id: int, db: Session = Depends(get_db)):
    """
    Get a specific intent by ID with full details.
    """
    controller = IntentController(db)
    return controller.get_intent_by_id(intent_id)


@router.put("/{intent_id}", response_model=IntentResponse)
def update_intent(intent_id: int, intent_data: IntentUpdate, db: Session = Depends(get_db)):
    """
    Update an existing intent.
    
    All fields are optional - only provided fields will be updated.
    """
    controller = IntentController(db)
    return controller.update_intent(intent_id, intent_data)


@router.delete("/{intent_id}")
def delete_intent(intent_id: int, db: Session = Depends(get_db)):
    """
    Delete an intent and all its patterns/responses.
    """
    controller = IntentController(db)
    return controller.delete_intent(intent_id)


@router.post("/sync")
def sync_from_json(db: Session = Depends(get_db)):
    """
    Import intents from the JSON dataset file into the database.
    
    - Skips intents that already exist
    - Returns count of newly imported intents
    """
    controller = IntentController(db)
    return controller.sync_from_json()


@router.post("/retrain")
def retrain_model(
    epochs: int = Query(default=100, ge=10, le=500, description="Number of training epochs"),
    db: Session = Depends(get_db)
):
    """
    Retrain the LSTM model using data from the database.
    
    - Training uses all intents and patterns in the database
    - After training, the new model is automatically loaded
    """
    controller = IntentController(db)
    return controller.retrain_model(epochs=epochs)


@router.post("/export")
def export_to_json(db: Session = Depends(get_db)):
    """
    Export all intents from database to JSON file.
    """
    controller = IntentController(db)
    return controller.export_to_json()
