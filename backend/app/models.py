from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship

# --- TABELLA DI COLLEGAMENTO UTENTE-SCHEDA (Nuova!) ---
# Questa tabella dice: "L'utente X deve fare la scheda Y"
class UserWorkoutLink(SQLModel, table=True):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    workout_id: Optional[int] = Field(default=None, foreign_key="workout.id", primary_key=True)
    # Possiamo aggiungere campi extra qui in futuro (es. data assegnazione, stato completamento)
    is_active: bool = True 

# --- TABELLA UTENTI ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    is_manager: bool = False
    
    # Relazione: Un utente ha molte schede assegnate
    workouts: List["Workout"] = Relationship(back_populates="users", link_model=UserWorkoutLink)

# --- TABELLA LINK ESERCIZIO-SCHEDA ---
class WorkoutExerciseLink(SQLModel, table=True):
    workout_id: Optional[int] = Field(default=None, foreign_key="workout.id", primary_key=True)
    exercise_id: Optional[int] = Field(default=None, foreign_key="exercise.id", primary_key=True)
    order: int = 0
    sets: int = 3
    reps: Optional[int] = None
    time_seconds: Optional[int] = None
    rest_seconds: int = 90

# --- TABELLA ESERCIZI ---
class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    video_url: str
    default_rest: int = 60
    
    workouts: List["Workout"] = Relationship(back_populates="exercises", link_model=WorkoutExerciseLink)

# --- TABELLA SCHEDE ---
class Workout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    
    # Relazione Esercizi
    exercises: List[Exercise] = Relationship(back_populates="workouts", link_model=WorkoutExerciseLink)
    
    # Relazione Utenti (Nuova!)
    users: List[User] = Relationship(back_populates="workouts", link_model=UserWorkoutLink)

# --- DTO LETTURA ---
class ExerciseRead(SQLModel):
    id: int
    title: str
    description: str
    video_url: str
    default_rest: int

class WorkoutReadWithExercises(SQLModel):
    id: int
    title: str
    description: Optional[str] = None
    exercises: List[ExerciseRead] = []