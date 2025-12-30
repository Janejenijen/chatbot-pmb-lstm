from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from service.training_service import TrainingService


router = APIRouter(prefix="/training", tags=["Training"])


@router.get("/history")
def get_all_training_history(db: Session = Depends(get_db)):
    """
    Get all training history records.
    Returns a list of all past training runs with basic metrics.
    """
    service = TrainingService(db)
    records = service.get_all_training_history()
    
    return [
        {
            "id": r.id,
            "trained_at": r.trained_at.isoformat() if r.trained_at else None,
            "split_ratio": r.split_ratio,
            "epochs_run": r.epochs_run,
            "total_samples": r.total_samples,
            "train_accuracy": round(r.train_accuracy * 100, 2),
            "val_accuracy": round(r.val_accuracy * 100, 2),
            "test_accuracy": round(r.test_accuracy * 100, 2),
        }
        for r in records
    ]


@router.get("/history/{history_id}")
def get_training_history_detail(history_id: int, db: Session = Depends(get_db)):
    """
    Get detailed training history by ID.
    Includes confusion matrix and classification report.
    """
    service = TrainingService(db)
    record = service.get_training_history_by_id(history_id)
    
    if not record:
        raise HTTPException(status_code=404, detail=f"Training history {history_id} not found")
    
    return record


@router.delete("/history/{history_id}")
def delete_training_history(history_id: int, db: Session = Depends(get_db)):
    """
    Delete a training history record.
    """
    service = TrainingService(db)
    success = service.delete_training_history(history_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Training history {history_id} not found")
    
    return {"message": f"Training history {history_id} deleted successfully"}
