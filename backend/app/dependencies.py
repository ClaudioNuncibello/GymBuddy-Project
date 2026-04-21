from typing import Annotated
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from jose import JWTError, jwt

from .database import get_session
from .models import User
from .security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=401, 
        detail="Credenziali non valide", 
        headers={"WWW-Authenticate": "Bearer"}
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
    if not current_user.is_manager: 
        raise HTTPException(status_code=403, detail="Non hai i permessi")
    return current_user
