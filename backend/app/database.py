import os
from sqlmodel import SQLModel, create_engine, Session

# Leggiamo le variabili d'ambiente (quelle nel file docker-compose/env)
# "db" è il nome del servizio nel docker-compose
POSTGRES_USER = os.getenv("POSTGRES_USER", "myuser")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "mypassword")
POSTGRES_DB = os.getenv("POSTGRES_DB", "myappdb")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db") 
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

# Costruiamo l'URL di connessione
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Creiamo il motore di connessione
engine = create_engine(DATABASE_URL, echo=True) # echo=True stampa le query SQL nel terminale (utile per debug)

# Funzione per ottenere la sessione (da usare nelle API)
def get_session():
    with Session(engine) as session:
        yield session

# Funzione per creare le tabelle all'avvio
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)