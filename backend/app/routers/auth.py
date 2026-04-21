from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from ..database import get_session
from ..models import User
from ..security import verify_password, create_access_token, get_password_hash
from ..dependencies import get_current_manager, get_current_user
from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str
    is_manager: bool = False

router = APIRouter(tags=["Auth"])

@router.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Username o password errati")
    return {"access_token": create_access_token(data={"sub": user.username, "is_manager": user.is_manager}), "token_type": "bearer"}

@router.post("/refresh")
def refresh_token(u: User = Depends(get_current_user)):
    return {"access_token": create_access_token(data={"sub": u.username, "is_manager": u.is_manager}), "token_type": "bearer"}

@router.post("/register", response_model=User)
def register_user(user_in: UserCreate, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    if session.exec(select(User).where(User.username == user_in.username)).first():
        raise HTTPException(status_code=400, detail="Username già in uso")
    db_user = User(username=user_in.username, hashed_password=get_password_hash(user_in.password), is_manager=user_in.is_manager)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user
