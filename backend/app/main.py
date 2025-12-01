from contextlib import asynccontextmanager
from typing import List, Annotated, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse 
from sqlmodel import Session, select, SQLModel
from jose import JWTError, jwt
from sqlalchemy.orm import selectinload 
import os

from .database import create_db_and_tables, get_session
from .models import Exercise, Workout, WorkoutExerciseLink, User, UserWorkoutLink, WorkoutReadWithExercises
from .security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM

# --- DTO (Data Transfer Objects) ---

class UserCreate(SQLModel):
    username: str
    password: str
    is_manager: bool = False

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
    description: str  # <--- AGGIUNTO: Ora inviamo anche la descrizione!
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
        if username is None: raise credentials_exception
    except JWTError: raise credentials_exception
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None: raise credentials_exception
    return user

async def get_current_manager(current_user: User = Depends(get_current_user)):
    if not current_user.is_manager: raise HTTPException(status_code=403, detail="Non hai i permessi da Manager")
    return current_user

# --- GESTIONE VIDEO/IMMAGINI ---
@app.get("/video/{filename}")
def get_video(filename: str):
    file_path = f"static/videos/{filename}"
    if not os.path.exists(file_path): file_path = f"/app/static/videos/{filename}"
    if not os.path.exists(file_path): raise HTTPException(status_code=404, detail="Video non trovato")
    return FileResponse(file_path, media_type="video/mp4", headers={"Accept-Ranges": "bytes"})

@app.get("/image/{filename}")
def get_image(filename: str):
    file_path = f"static/images/{filename}"
    if not os.path.exists(file_path): file_path = f"/app/static/images/{filename}"
    if not os.path.exists(file_path): raise HTTPException(status_code=404, detail="Immagine non trovata")
    return FileResponse(file_path)

# --- ENDPOINTS AUTH ---
@app.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Username o password errati")
    return {"access_token": create_access_token(data={"sub": user.username, "is_manager": user.is_manager}), "token_type": "bearer"}

@app.post("/register", response_model=User)
def register_user(user_in: UserCreate, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    if session.exec(select(User).where(User.username == user_in.username)).first():
        raise HTTPException(status_code=400, detail="Username già in uso")
    db_user = User(username=user_in.username, hashed_password=get_password_hash(user_in.password), is_manager=user_in.is_manager)
    session.add(db_user); session.commit(); session.refresh(db_user)
    return db_user

# --- GESTIONE UTENTI ---
@app.get("/users/", response_model=List[User])
def read_users(session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    return session.exec(select(User)).all()

@app.patch("/users/{user_id}", response_model=User)
def update_user(user_id: int, user_update: UserUpdate, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    db_user = session.get(User, user_id)
    if not db_user: raise HTTPException(status_code=404)
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data: db_user.hashed_password = get_password_hash(update_data.pop("password"))
    for k, v in update_data.items(): setattr(db_user, k, v)
    session.add(db_user); session.commit(); session.refresh(db_user); return db_user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    user = session.get(User, user_id)
    if not user: raise HTTPException(status_code=404)
    for link in session.exec(select(UserWorkoutLink).where(UserWorkoutLink.user_id == user_id)).all(): session.delete(link)
    session.delete(user); session.commit(); return {"message": "Eliminato"}

# --- GESTIONE ESERCIZI ---
@app.get("/exercises/", response_model=List[Exercise])
def read_exercises(session: Session = Depends(get_session)): return session.exec(select(Exercise)).all()

@app.post("/exercises/", response_model=Exercise)
def create_exercise(e: Exercise, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    session.add(e); session.commit(); session.refresh(e); return e

@app.patch("/exercises/{exercise_id}", response_model=Exercise)
def update_exercise(id: int, u: ExerciseUpdate, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    db_e = session.get(Exercise, id)
    if not db_e: raise HTTPException(status_code=404)
    for k, v in u.model_dump(exclude_unset=True).items(): setattr(db_e, k, v)
    session.add(db_e); session.commit(); session.refresh(db_e); return db_e

@app.delete("/exercises/{exercise_id}")
def delete_exercise(id: int, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    e = session.get(Exercise, id)
    if not e: raise HTTPException(status_code=404)
    session.delete(e); session.commit(); return {"message": "Eliminato"}

# --- GESTIONE SCHEDE ---
@app.get("/workouts/", response_model=List[Workout])
def read_workouts(session: Session = Depends(get_session), u: User = Depends(get_current_user)):
    if u.is_manager: return session.exec(select(Workout)).all()
    return session.exec(select(Workout).join(UserWorkoutLink).where(UserWorkoutLink.user_id == u.id)).all()

# --- MODIFICA CRITICA: Mappiamo la descrizione qui ---
@app.get("/workouts/{workout_id}", response_model=WorkoutDetailPublic)
def read_workout_details(workout_id: int, session: Session = Depends(get_session)):
    workout = session.get(Workout, workout_id)
    if not workout: raise HTTPException(status_code=404, detail="Scheda non trovata")
    
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
            description=exercise.description, # <--- POPOLIAMO IL CAMPO!
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
def create_workout(w: Workout, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    session.add(w); session.commit(); session.refresh(w); return w

@app.patch("/workouts/{workout_id}", response_model=Workout)
def update_workout(id: int, u: WorkoutUpdate, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    w = session.get(Workout, id); 
    if not w: raise HTTPException(status_code=404)
    for k, v in u.model_dump(exclude_unset=True).items(): setattr(w, k, v)
    session.add(w); session.commit(); session.refresh(w); return w

@app.delete("/workouts/{workout_id}")
def delete_workout(id: int, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    w = session.get(Workout, id); 
    if not w: raise HTTPException(status_code=404)
    for l in session.exec(select(WorkoutExerciseLink).where(WorkoutExerciseLink.workout_id == id)).all(): session.delete(l)
    for l in session.exec(select(UserWorkoutLink).where(UserWorkoutLink.workout_id == id)).all(): session.delete(l)
    session.delete(w); session.commit(); return {"message": "Eliminato"}

@app.post("/workouts/{workout_id}/add-exercise/{exercise_id}")
def add_exercise_to_workout(wid: int, eid: int, sets: int, reps: int, time_seconds: Optional[int]=None, rest_seconds: int=90, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    if not session.get(Workout, wid) or not session.get(Exercise, eid): raise HTTPException(status_code=404)
    session.add(WorkoutExerciseLink(workout_id=wid, exercise_id=eid, sets=sets, reps=reps, time_seconds=time_seconds, rest_seconds=rest_seconds))
    session.commit()
    return {"message": "Aggiunto"}

@app.delete("/workouts/{workout_id}/exercises/{exercise_id}")
def remove_exercise_from_workout(wid: int, eid: int, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    l = session.exec(select(WorkoutExerciseLink).where(WorkoutExerciseLink.workout_id == wid, WorkoutExerciseLink.exercise_id == eid)).first()
    if not l: raise HTTPException(status_code=404)
    session.delete(l); session.commit(); return {"message": "Rimosso"}

@app.post("/assign-workout/{workout_id}/to-user/{username}")
def assign_workout_to_user(wid: int, username: str, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    u = session.exec(select(User).where(User.username == username)).first()
    w = session.get(Workout, wid)
    if not u or not w: raise HTTPException(status_code=404)
    if session.exec(select(UserWorkoutLink).where(UserWorkoutLink.user_id == u.id, UserWorkoutLink.workout_id == wid)).first(): return {"message": "Già assegnata"}
    session.add(UserWorkoutLink(user_id=u.id, workout_id=wid)); session.commit()
    return {"message": "Assegnata"}

@app.get("/workouts/{workout_id}/users", response_model=List[User])
def read_workout_users(workout_id: int, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    return session.exec(select(User).join(UserWorkoutLink).where(UserWorkoutLink.workout_id == workout_id)).all()

@app.delete("/assign-workout/{workout_id}/user/{user_id}")
def remove_workout_assignment(workout_id: int, user_id: int, session: Session = Depends(get_session), m: User = Depends(get_current_manager)):
    link = session.exec(select(UserWorkoutLink).where(UserWorkoutLink.workout_id == workout_id).where(UserWorkoutLink.user_id == user_id)).first()
    if not link: raise HTTPException(status_code=404)
    session.delete(link); session.commit()
    return {"message": "Rimosso"}