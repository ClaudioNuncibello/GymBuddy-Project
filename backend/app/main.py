from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
import os

from .database import create_db_and_tables, get_session, engine
from .models import User
from .security import get_password_hash

# Importiamo i routers
from .routers import auth, users, exercises, workouts, sessions

def create_initial_admin(session: Session):
    """Crea l'utente admin se non esiste."""
    admin_user = session.exec(select(User).where(User.username == "admin")).first()
    if not admin_user:
        # ** IMPORTANTE: CAMBIA LA PASSWORD DI DEFAULT PRIMA DEL DEPLOY **
        admin_password = os.getenv("ADMIN_DEFAULT_PASSWORD", "CHANGE_ME_NOW")
        admin_password_hash = get_password_hash(admin_password) 
        new_admin = User(
            username="admin", 
            hashed_password=admin_password_hash, 
            is_manager=True
        )
        session.add(new_admin)
        session.commit()
        print("Utente 'admin' iniziale creato con la password di default o env.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    
    # Creazione Admin
    with Session(engine) as session:
        create_initial_admin(session)
    
    yield

app = FastAPI(lifespan=lifespan)

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Includiamo i router
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(exercises.router)
app.include_router(workouts.router)
app.include_router(sessions.router)
