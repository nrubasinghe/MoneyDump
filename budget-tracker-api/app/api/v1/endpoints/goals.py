from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, models
from app.database import get_db
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Goal])
def read_goals(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_goals(db, user_id=current_user.id, skip=skip, limit=limit)

@router.post("/", response_model=schemas.Goal)
def create_goal(
    goal: schemas.GoalCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_goal(db=db, goal=goal, user_id=current_user.id)

@router.get("/{goal_id}", response_model=schemas.Goal)
def read_goal(
    goal_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_goal = crud.get_goal(db, goal_id=goal_id, user_id=current_user.id)
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return db_goal

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_goal = crud.delete_goal(db, goal_id=goal_id, user_id=current_user.id)
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}
