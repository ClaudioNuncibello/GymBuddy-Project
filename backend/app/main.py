from contextlib import asynccontextmanager
from typing import List, Annotated, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, SQLModel
from jose import JWTError, jwt
from sqlalchemy.orm import selectinload 

from .database import create_db_and_tables, get_session
from .models import Exercise, Workout, WorkoutExerciseLink, User, UserWorkoutLink, WorkoutReadWithExercises
from .security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM

# --- DTO (Data Transfer Objects) ---

# 1. Modello Input per Creazione Utente (FIX per il tuo errore)
class UserCreate(SQLModel):
    username: str
    password: str
    is_manager: bool = False

# 2. Modello Input per Aggiornamento Utente
class UserUpdate(SQLModel):
    username: Optional[str] = None
    password: Optional[str] = None
    is_manager: Optional[bool] = None

class ExerciseUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    default_rest: Optional[int] = None

class WorkoutUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None

class ExerciseWithWorkload(SQLModel):
    id: int
    title: str
    video_url: str
    sets: int
    reps: int
    time_seconds: Optional[int] = None
    rest_seconds: int

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

# --- DIPENDENZE DI SICUREZZA ---
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

# --- GESTIONE UTENTI ---

@app.get("/users/", response_model=List[User])
def read_users(session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    return session.exec(select(User)).all()

# FIX: Usiamo UserCreate invece di User qui sotto
@app.post("/register", response_model=User)
def register_user(user_in: UserCreate, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    existing_user = session.exec(select(User).where(User.username == user_in.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username già in uso")
    
    # Creiamo l'utente DB manualmente trasformando la password
    db_user = User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password), # Hashiamo qui!
        is_manager=user_in.is_manager
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@app.patch("/users/{user_id}", response_model=User)
def update_user(user_id: int, user_update: UserUpdate, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        password = update_data.pop("password")
        db_user.hashed_password = get_password_hash(password)
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    # Rimuovi link
    links = session.exec(select(UserWorkoutLink).where(UserWorkoutLink.user_id == user_id)).all()
    for link in links:
        session.delete(link)
        
    session.delete(user)
    session.commit()
    return {"message": "Utente eliminato"}

# --- GESTIONE ESERCIZI ---

@app.get("/exercises/", response_model=List[Exercise])
def read_exercises(session: Session = Depends(get_session)):
    return session.exec(select(Exercise)).all()

@app.post("/exercises/", response_model=Exercise)
def create_exercise(exercise: Exercise, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    session.add(exercise)
    session.commit()
    session.refresh(exercise)
    return exercise

@app.patch("/exercises/{exercise_id}", response_model=Exercise)
def update_exercise(exercise_id: int, exercise_update: ExerciseUpdate, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    db_exercise = session.get(Exercise, exercise_id)
    if not db_exercise:
        raise HTTPException(status_code=404, detail="Esercizio non trovato")
    
    update_data = exercise_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_exercise, key, value)
        
    session.add(db_exercise)
    session.commit()
    session.refresh(db_exercise)
    return db_exercise

@app.delete("/exercises/{exercise_id}")
def delete_exercise(exercise_id: int, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    exercise = session.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Esercizio non trovato")
    session.delete(exercise)
    session.commit()
    return {"message": "Esercizio eliminato"}

# --- GESTIONE SCHEDE ---

@app.get("/workouts/", response_model=List[Workout])
def read_workouts(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.is_manager:
        return session.exec(select(Workout)).all()
    else:
        statement = select(Workout).join(UserWorkoutLink).where(UserWorkoutLink.user_id == current_user.id)
        return session.exec(statement).all()

@app.get("/workouts/{workout_id}", response_model=WorkoutDetailPublic)
def read_workout_details(workout_id: int, session: Session = Depends(get_session)):
    workout = session.get(Workout, workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
    
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
            time_seconds=link.time_seconds,
            rest_seconds=link.rest_seconds
        ))

    return WorkoutDetailPublic(
        id=workout.id,
        title=workout.title,
        description=workout.description,
        exercises=exercises_data
    )

@app.post("/workouts/", response_model=Workout)
def create_workout(workout: Workout, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout

@app.patch("/workouts/{workout_id}", response_model=Workout)
def update_workout(workout_id: int, workout_update: WorkoutUpdate, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    db_workout = session.get(Workout, workout_id)
    if not db_workout:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
        
    update_data = workout_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_workout, key, value)
        
    session.add(db_workout)
    session.commit()
    session.refresh(db_workout)
    return db_workout

@app.delete("/workouts/{workout_id}")
def delete_workout(workout_id: int, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    workout = session.get(Workout, workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
    
    links = session.exec(select(WorkoutExerciseLink).where(WorkoutExerciseLink.workout_id == workout_id)).all()
    for link in links:
        session.delete(link)
    
    user_links = session.exec(select(UserWorkoutLink).where(UserWorkoutLink.workout_id == workout_id)).all()
    for link in user_links:
        session.delete(link)

    session.delete(workout)
    session.commit()
    return {"message": "Scheda eliminata"}

# --- ASSEGNAZIONI ---

@app.post("/workouts/{workout_id}/add-exercise/{exercise_id}")
def add_exercise_to_workout(
    workout_id: int, exercise_id: int, sets: int, reps: int, 
    time_seconds: Optional[int] = None, rest_seconds: int = 90,
    session: Session = Depends(get_session), manager: User = Depends(get_current_manager)
):
    workout = session.get(Workout, workout_id)
    exercise = session.get(Exercise, exercise_id)
    if not workout or not exercise:
        raise HTTPException(status_code=404, detail="Not found")

    link = WorkoutExerciseLink(
        workout_id=workout_id, exercise_id=exercise_id,
        sets=sets, reps=reps, time_seconds=time_seconds, rest_seconds=rest_seconds
    )
    session.add(link)
    session.commit()
    return {"message": "Esercizio aggiunto"}

@app.post("/assign-workout/{workout_id}/to-user/{username}")
def assign_workout_to_user(
    workout_id: int, username: str, 
    session: Session = Depends(get_session), manager: User = Depends(get_current_manager)
):
    target_user = session.exec(select(User).where(User.username == username)).first()
    workout = session.get(Workout, workout_id)
    
    if not target_user or not workout:
        raise HTTPException(status_code=404, detail="Utente o Scheda non trovati")
        
    existing_link = session.exec(
        select(UserWorkoutLink)
        .where(UserWorkoutLink.user_id == target_user.id)
        .where(UserWorkoutLink.workout_id == workout_id)
    ).first()
    
    if existing_link:
        return {"message": "Scheda già assegnata"}

    link = UserWorkoutLink(user_id=target_user.id, workout_id=workout_id)
    session.add(link)
    session.commit()
    
    return {"message": f"Scheda '{workout.title}' assegnata a {target_user.username}"}

@app.get("/workouts/{workout_id}/users", response_model=List[User])
def read_workout_users(
    workout_id: int, 
    session: Session = Depends(get_session), 
    manager: User = Depends(get_current_manager)
):
    # Seleziona gli Utenti collegati a questo workout
    statement = select(User).join(UserWorkoutLink).where(UserWorkoutLink.workout_id == workout_id)
    return session.exec(statement).all()

# 2. Rimuovi assegnazione (Scollega utente da scheda)
@app.delete("/assign-workout/{workout_id}/user/{user_id}")
def remove_workout_assignment(
    workout_id: int, 
    user_id: int, 
    session: Session = Depends(get_session), 
    manager: User = Depends(get_current_manager)
):
    link = session.exec(
        select(UserWorkoutLink)
        .where(UserWorkoutLink.workout_id == workout_id)
        .where(UserWorkoutLink.user_id == user_id)
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Assegnazione non trovata")
        
    session.delete(link)
    session.commit()
    return {"message": "Assegnazione rimossa"}