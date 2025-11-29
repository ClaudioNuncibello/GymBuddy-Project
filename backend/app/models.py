from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship

# --- TABELLA UTENTI ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    is_manager: bool = False

# --- TABELLA LINK (Many-to-Many) ---
class WorkoutExerciseLink(SQLModel, table=True):
    workout_id: Optional[int] = Field(default=None, foreign_key="workout.id", primary_key=True)
    exercise_id: Optional[int] = Field(default=None, foreign_key="exercise.id", primary_key=True)
    order: int = 0
    sets: int = 3
    reps: Optional[int] = None
    time_seconds: Optional[int] = None
    rest_seconds: int = 90

# --- TABELLA ESERCIZI (Database) ---
class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    video_url: str
    default_rest: int = 60
    
    # Relazione inversa (causa del loop se letta direttamente)
    workouts: List["Workout"] = Relationship(back_populates="exercises", link_model=WorkoutExerciseLink)

# --- TABELLA SCHEDE (Database) ---
class Workout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    
    # Relazione
    exercises: List[Exercise] = Relationship(back_populates="workouts", link_model=WorkoutExerciseLink)

# --- MODELLI DI LETTURA (DTO) ---
# Fondamentali per evitare il loop infinito

# 1. Esercizio "Puro" (senza lista workouts)
class ExerciseRead(SQLModel):
    id: int
    title: str
    description: str
    video_url: str
    default_rest: int

# 2. Scheda con lista di Esercizi Puri
class WorkoutReadWithExercises(SQLModel):
    id: int
    title: str
    description: Optional[str] = None
    # Usiamo ExerciseRead qui, NON Exercise! Questo spezza il cerchio.
    exercises: List[ExerciseRead] = []