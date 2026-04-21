from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import os
import shutil
from sqlmodel import Session, select
from pydantic import BaseModel

from ..database import get_session
from ..models import Exercise, User
from ..dependencies import get_current_manager

class ExerciseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    default_rest: Optional[int] = None

router = APIRouter(prefix="/exercises", tags=["Exercises"])

@router.get("/", response_model=List[Exercise])
def read_exercises(skip: int = 0, limit: int = 50, session: Session = Depends(get_session)): 
    return session.exec(select(Exercise).offset(skip).limit(limit)).all()

@router.post("/", response_model=Exercise)
def create_exercise(e: Exercise, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    session.add(e)
    session.commit()
    session.refresh(e)
    return e

@router.patch("/{exercise_id}", response_model=Exercise)
def update_exercise(exercise_id: int, u: ExerciseUpdate, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    db_e = session.get(Exercise, exercise_id)
    if not db_e: raise HTTPException(status_code=404)
    for k, v in u.model_dump(exclude_unset=True).items(): setattr(db_e, k, v)
    session.add(db_e)
    session.commit()
    session.refresh(db_e)
    return db_e

@router.delete("/{exercise_id}")
def delete_exercise(exercise_id: int, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    e = session.get(Exercise, exercise_id)
    if not e: raise HTTPException(status_code=404)
    session.delete(e)
    session.commit()
    return {"message": "Eliminato"}

@router.post("/{exercise_id}/upload-video")
async def upload_exercise_video(exercise_id: int, file: UploadFile = File(...), session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    db_e = session.get(Exercise, exercise_id)
    if not db_e: raise HTTPException(status_code=404)
    
    os.makedirs("/app/static/videos", exist_ok=True)
    file_location = f"/app/static/videos/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    db_e.video_url = file.filename
    session.add(db_e)
    session.commit()
    return {"info": f"Video salvato in '{file.filename}'", "url": db_e.video_url}

@router.post("/{exercise_id}/upload-image")
async def upload_exercise_image(exercise_id: int, file: UploadFile = File(...), session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    db_e = session.get(Exercise, exercise_id)
    if not db_e: raise HTTPException(status_code=404)
    
    os.makedirs("/app/static/images", exist_ok=True)
    file_location = f"/app/static/images/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # Usiamo lo stesso campo per comodità, o se serve uno per l'immagine si potrà aggiungere al model successiv.
    # Per ora salviamo tutto e torniamo ok.
    return {"info": f"Immagine salvata in '{file.filename}'", "filename": file.filename}
