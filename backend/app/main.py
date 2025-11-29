from contextlib import asynccontextmanager
from typing import List, Annotated, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, SQLModel
from jose import JWTError, jwt
from sqlalchemy.orm import selectinload 

from .database import create_db_and_tables, get_session
from .models import Exercise, Workout, WorkoutExerciseLink, User
from .security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM

# --- DTO DI RISPOSTA (Dati per il Frontend) ---
class ExerciseWithWorkload(SQLModel):
    id: int
    title: str
    video_url: str
    sets: int
    reps: int
    # NUOVI CAMPI TEMPORALI
    time_seconds: Optional[int] = None # Tempo esecuzione (es. Plank)
    rest_seconds: int                  # Tempo recupero

class WorkoutDetailPublic(SQLModel):
    id: int
    title: str
    description: Optional[str] = None
    exercises: List[ExerciseWithWorkload] = []

# --- SETUP APP ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DIPENDENZE ---
async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali non valide",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_manager(current_user: User = Depends(get_current_user)):
    if not current_user.is_manager:
        raise HTTPException(status_code=403, detail="Non hai i permessi da Manager")
    return current_user

# --- ENDPOINTS AUTH ---
@app.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Username o password errati")
    
    access_token = create_access_token(data={"sub": user.username, "is_manager": user.is_manager})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register")
def register_user(user: User, session: Session = Depends(get_session)):
    existing_user = session.exec(select(User).where(User.username == user.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username già in uso")
    user.hashed_password = get_password_hash(user.hashed_password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"message": "Utente creato!", "username": user.username}

# --- ENDPOINTS LETTURA ---
@app.get("/exercises/", response_model=List[Exercise])
def read_exercises(session: Session = Depends(get_session)):
    return session.exec(select(Exercise)).all()

@app.get("/workouts/", response_model=List[Workout])
def read_workouts(session: Session = Depends(get_session)):
    return session.exec(select(Workout)).all()

@app.get("/workouts/{workout_id}", response_model=WorkoutDetailPublic)
def read_workout_details(workout_id: int, session: Session = Depends(get_session)):
    workout = session.get(Workout, workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
    
    # Recuperiamo link + esercizio
    results = session.exec(
        select(WorkoutExerciseLink, Exercise)
        .where(WorkoutExerciseLink.workout_id == workout_id)
        .join(Exercise)
        .order_by(WorkoutExerciseLink.order)
    ).all()

    exercises_data = []
    for link, exercise in results:
        exercises_data.append(ExerciseWithWorkload(
            id=exercise.id,
            title=exercise.title,
            video_url=exercise.video_url,
            sets=link.sets,
            reps=link.reps if link.reps else 0,
            # MAPPIAMO I NUOVI CAMPI TEMPO QUI
            time_seconds=link.time_seconds,
            rest_seconds=link.rest_seconds
        ))

    return WorkoutDetailPublic(
        id=workout.id,
        title=workout.title,
        description=workout.description,
        exercises=exercises_data
    )

# --- ENDPOINTS SCRITTURA ---
@app.post("/exercises/", response_model=Exercise)
def create_exercise(exercise: Exercise, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    session.add(exercise)
    session.commit()
    session.refresh(exercise)
    return exercise

@app.post("/workouts/", response_model=Workout)
def create_workout(workout: Workout, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout

# --- AGGIUNTA ESERCIZIO (Aggiornato con tempi) ---
@app.post("/workouts/{workout_id}/add-exercise/{exercise_id}")
def add_exercise_to_workout(
    workout_id: int, 
    exercise_id: int, 
    sets: int, 
    reps: int, 
    # NUOVI PARAMETRI OPZIONALI
    time_seconds: Optional[int] = None,
    rest_seconds: int = 90,
    session: Session = Depends(get_session),
    manager: User = Depends(get_current_manager)
):
    workout = session.get(Workout, workout_id)
    exercise = session.get(Exercise, exercise_id)
    if not workout or not exercise:
        raise HTTPException(status_code=404, detail="Workout o Esercizio non trovati")

    link = WorkoutExerciseLink(
        workout_id=workout_id,
        exercise_id=exercise_id,
        sets=sets,
        reps=reps,
        # SALVIAMO I TEMPI
        time_seconds=time_seconds,
        rest_seconds=rest_seconds
    )
    session.add(link)
    session.commit()
    return {"message": "Esercizio aggiunto con tempi salvati"}