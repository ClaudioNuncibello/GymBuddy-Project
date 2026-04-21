from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from ..database import get_session
from ..models import User, UserWorkoutLink
from ..dependencies import get_current_manager
from ..security import get_password_hash

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    is_manager: Optional[bool] = None

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[User])
def read_users(skip: int = 0, limit: int = 50, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    return session.exec(select(User).offset(skip).limit(limit)).all()

@router.patch("/{user_id}", response_model=User)
def update_user(user_id: int, user_update: UserUpdate, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    db_user = session.get(User, user_id)
    if not db_user: raise HTTPException(status_code=404)
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data: db_user.hashed_password = get_password_hash(update_data.pop("password"))
    for k, v in update_data.items(): setattr(db_user, k, v)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session), manager: User = Depends(get_current_manager)):
    user = session.get(User, user_id)
    if not user: raise HTTPException(status_code=404)
    for link in session.exec(select(UserWorkoutLink).where(UserWorkoutLink.user_id == user_id)).all():
        session.delete(link)
    session.delete(user)
    session.commit()
    return {"message": "Eliminato"}
