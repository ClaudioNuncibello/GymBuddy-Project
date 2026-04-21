from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from ..database import get_session
from ..models import Workout, Exercise, WorkoutExerciseLink, User, UserWorkoutLink
from ..dependencies import get_current_user, get_current_manager

class WorkoutUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class ExerciseWithWorkload(BaseModel):
    id: int
    title: str
    description: str
    video_url: str
    sets: int
    reps: int
    time_seconds: Optional[int] = None
    rest_seconds: int
    notes: Optional[str] = None

class WorkoutDetailPublic(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    exercises: List[ExerciseWithWorkload] = []

router = APIRouter(tags=["Workouts"])

@router.get("/workouts/", response_model=List[Workout])
def read_workouts(skip: int = 0, limit: int = 50, session: Session = Depends(get_session), u: User = Depends(get_current_user)):
    if u.is_manager: return session.exec(select(Workout).offset(skip).limit(limit)).all()
    return session.exec(select(Workout).join(UserWorkoutLink).where(UserWorkoutLink.user_id == u.id).offset(skip).limit(limit)).all()

@router.get("/workouts/{workout_id}", response_model=WorkoutDetailPublic)
def read_workout_details(workout_id: int, session: Session = Depends(get_session)):
    w = session.get(Workout, workout_id)
    if not w: raise HTTPException(status_code=404)
    
    # Ordina per il campo 'order' o id se non presente
    results = session.exec(select(WorkoutExerciseLink, Exercise).where(WorkoutExerciseLink.workout_id == workout_id).join(Exercise).order_by(WorkoutExerciseLink.order)).all()
    
    data = []
    for l, e in results:
        data.append(ExerciseWithWorkload(
            id=e.id, 
            title=e.title, 
            description=e.description, 
            video_url=e.video_url, 
            sets=l.sets, 
            reps=l.reps if l.reps else 0, 
            time_seconds=l.time_seconds, 
            rest_seconds=l.rest_seconds,
            notes=l.notes
        ))
    
    return WorkoutDetailPublic(id=w.id, title=w.title, description=w.description, exercises=data)

@router.post("/workouts/", response_model=Workout)
def create_workout(w: Workout, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    session.add(w)
    session.commit()
    session.refresh(w)
    return w

@router.patch("/workouts/{workout_id}", response_model=Workout)
def update_workout(workout_id: int, u: WorkoutUpdate, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    w = session.get(Workout, workout_id)
    if not w: raise HTTPException(status_code=404)
    for k, v in u.model_dump(exclude_unset=True).items(): setattr(w, k, v)
    session.add(w)
    session.commit()
    session.refresh(w)
    return w

@router.delete("/workouts/{workout_id}")
def delete_workout(workout_id: int, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    w = session.get(Workout, workout_id)
    if not w: raise HTTPException(status_code=404)
    for l in session.exec(select(WorkoutExerciseLink).where(WorkoutExerciseLink.workout_id == workout_id)).all():
        session.delete(l)
    for l in session.exec(select(UserWorkoutLink).where(UserWorkoutLink.workout_id == workout_id)).all(): 
        session.delete(l)
    session.delete(w)
    session.commit()
    return {"message": "Eliminato"}

# --- ASSEGNAZIONI ED ESERCIZI ---

@router.post("/workouts/{workout_id}/add-exercise/{exercise_id}")
def add_exercise_to_workout(
    workout_id: int, exercise_id: int, 
    sets: int, reps: int, time_seconds: Optional[int]=None, rest_seconds: int=90, 
    notes: Optional[str] = None,
    session: Session = Depends(get_session), m: User = Depends(get_current_manager)
):
    if not session.get(Workout, workout_id) or not session.get(Exercise, exercise_id): raise HTTPException(status_code=404)
    
    link = session.exec(select(WorkoutExerciseLink).where(
        WorkoutExerciseLink.workout_id == workout_id, 
        WorkoutExerciseLink.exercise_id == exercise_id
    )).first()

    if link:
        link.sets = sets
        link.reps = reps
        link.time_seconds = time_seconds
        link.rest_seconds = rest_seconds
        link.notes = notes
        session.add(link)
    else:
        session.add(WorkoutExerciseLink(
            workout_id=workout_id, 
            exercise_id=exercise_id, 
            sets=sets, 
            reps=reps, 
            time_seconds=time_seconds, 
            rest_seconds=rest_seconds,
            notes=notes
        ))
    
    session.commit()
    return {"message": "Salvato con successo"}

@router.delete("/workouts/{workout_id}/exercises/{exercise_id}")
def remove_exercise_from_workout(
    workout_id: int, exercise_id: int, 
    session: Session = Depends(get_session), m: User = Depends(get_current_manager)
):
    l = session.exec(select(WorkoutExerciseLink).where(WorkoutExerciseLink.workout_id == workout_id, WorkoutExerciseLink.exercise_id == exercise_id)).first()
    if not l: raise HTTPException(status_code=404)
    session.delete(l); session.commit()
    return {"message": "Rimosso"}

@router.post("/assign-workout/{workout_id}/to-user/{username}")
def assign_workout_to_user(
    workout_id: int, username: str, 
    session: Session = Depends(get_session), m: User = Depends(get_current_manager)
):
    u = session.exec(select(User).where(User.username == username)).first()
    w = session.get(Workout, workout_id)
    if not u or not w: raise HTTPException(status_code=404)
    if session.exec(select(UserWorkoutLink).where(UserWorkoutLink.user_id == u.id, UserWorkoutLink.workout_id == workout_id)).first(): 
        return {"message": "Già assegnata"}
    session.add(UserWorkoutLink(user_id=u.id, workout_id=workout_id))
    session.commit()
    return {"message": "Assegnata"}

@router.get("/workouts/{workout_id}/users", response_model=List[User])
def read_workout_users(workout_id: int, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    return session.exec(select(User).join(UserWorkoutLink).where(UserWorkoutLink.workout_id == workout_id)).all()

@router.delete("/assign-workout/{workout_id}/user/{user_id}")
def remove_workout_assignment(workout_id: int, user_id: int, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    link = session.exec(select(UserWorkoutLink).where(UserWorkoutLink.workout_id == workout_id).where(UserWorkoutLink.user_id == user_id)).first()
    if not link: raise HTTPException(status_code=404)
    session.delete(link); session.commit()
    return {"message": "Rimosso"}

@router.get("/users/{user_id}/workouts", response_model=List[Workout])
def read_user_workouts(user_id: int, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    return session.exec(select(Workout).join(UserWorkoutLink).where(UserWorkoutLink.user_id == user_id)).all()
