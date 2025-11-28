from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from .database import create_db_and_tables, get_session
# Importiamo anche User ora
from .models import Exercise, Workout, WorkoutExerciseLink, User

# --- LIFECYCLE ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # All'avvio crea le tabelle nel database
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Gym App Backend Ready!"}

# 1. CREA UN ESERCIZIO (Per popolare il catalogo)
# TODO: Proteggere questo endpoint con password (Step 5)
@app.post("/exercises/", response_model=Exercise)
def create_exercise(exercise: Exercise, session: Session = Depends(get_session)):
    session.add(exercise)
    session.commit()
    session.refresh(exercise)
    return exercise

# 2. LEGGI TUTTI GLI ESERCIZI
@app.get("/exercises/", response_model=List[Exercise])
def read_exercises(session: Session = Depends(get_session)):
    exercises = session.exec(select(Exercise)).all()
    return exercises

# 3. CREA UNA SCHEDA VUOTA
# TODO: Proteggere questo endpoint con password (Step 5)
@app.post("/workouts/", response_model=Workout)
def create_workout(workout: Workout, session: Session = Depends(get_session)):
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout

# 4. AGGIUNGI ESERCIZIO A SCHEDA (Il cuore della logica)
# TODO: Proteggere questo endpoint con password (Step 5)
@app.post("/workouts/{workout_id}/add-exercise/{exercise_id}")
def add_exercise_to_workout(
    workout_id: int, 
    exercise_id: int, 
    sets: int, 
    reps: int, 
    session: Session = Depends(get_session)
):
    # Creiamo il collegamento manuale nella tabella Link
    link = WorkoutExerciseLink(
        workout_id=workout_id,
        exercise_id=exercise_id,
        sets=sets,
        reps=reps
    )
    session.add(link)
    session.commit()
    return {"message": "Esercizio aggiunto alla scheda!"}