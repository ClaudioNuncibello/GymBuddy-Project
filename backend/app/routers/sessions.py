from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, desc
from pydantic import BaseModel
from datetime import datetime

from ..database import get_session
from ..models import WorkoutSession, User, Workout
from ..dependencies import get_current_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])

class WorkoutSessionCreate(BaseModel):
    workout_id: int
    duration_seconds: int
    notes: Optional[str] = None

class WorkoutSessionRead(BaseModel):
    id: int
    user_id: int
    workout_id: int
    duration_seconds: int
    created_at: datetime
    notes: Optional[str] = None
    workout_title: str

@router.post("/", response_model=WorkoutSession)
def create_session(session_data: WorkoutSessionCreate, db: Session = Depends(get_session), u: User = Depends(get_current_user)):
    w = db.get(Workout, session_data.workout_id)
    if not w: raise HTTPException(status_code=404, detail="Scheda non trovata")
    
    new_session = WorkoutSession(
        user_id=u.id,
        workout_id=session_data.workout_id,
        duration_seconds=session_data.duration_seconds,
        notes=session_data.notes
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/me", response_model=List[WorkoutSessionRead])
def read_my_sessions(skip: int = 0, limit: int = 50, db: Session = Depends(get_session), u: User = Depends(get_current_user)):
    # Sort descending per visualizzare gli ultimi prima
    statement = select(WorkoutSession, Workout).join(Workout).where(WorkoutSession.user_id == u.id).order_by(desc(WorkoutSession.created_at)).offset(skip).limit(limit)
    results = db.exec(statement).all()
    
    data = []
    for ws, w in results:
        data.append(WorkoutSessionRead(
            id=ws.id,
            user_id=ws.user_id,
            workout_id=ws.workout_id,
            duration_seconds=ws.duration_seconds,
            created_at=ws.created_at,
            notes=ws.notes,
            workout_title=w.title
        ))
    return data
