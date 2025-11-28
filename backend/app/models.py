from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship

# --- TABELLA UTENTI (Gestori e Clienti) ---
# Aggiungiamo questa tabella per gestire l'autenticazione.
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str     # Mai salvare password in chiaro!
    is_manager: bool = False # Se True, ha accesso al pannello di controllo

# --- TABELLA DI COLLEGAMENTO (Many-to-Many) ---
# Questa è la tabella "magica" che unisce Esercizi e Schede.
# Contiene i dati specifici di QUELLA scheda (es. quante ripetizioni fare).
class WorkoutExerciseLink(SQLModel, table=True):
    workout_id: Optional[int] = Field(default=None, foreign_key="workout.id", primary_key=True)
    exercise_id: Optional[int] = Field(default=None, foreign_key="exercise.id", primary_key=True)
    
    # Dati specifici per l'esecuzione in questa scheda
    order: int = 0          # Per ordinare gli esercizi (1°, 2°, 3°...)
    sets: int = 3           # Numero di serie
    reps: Optional[int] = None      # Es: 12 ripetizioni
    time_seconds: Optional[int] = None # Es: 60 secondi (per Plank)
    rest_seconds: int = 90  # Tempo di recupero

# --- TABELLA ESERCIZI ---
# Il catalogo puro. L'esercizio "Push Up" esiste una volta sola qui.
class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    video_url: str          # URL del video (locale o cloud)
    default_rest: int = 60  # Recupero suggerito di base
    
    # Relazione inversa (non crea colonna nel DB, serve a Python per navigare)
    workouts: List["Workout"] = Relationship(back_populates="exercises", link_model=WorkoutExerciseLink)

# --- TABELLA SCHEDE (WORKOUTS) ---
class Workout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str              # Es: "Scheda Petto - Settimana 1"
    description: Optional[str] = None
    
    # Lista degli esercizi contenuti in questa scheda
    exercises: List[Exercise] = Relationship(back_populates="workouts", link_model=WorkoutExerciseLink)