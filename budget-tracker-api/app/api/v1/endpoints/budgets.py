from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, models
from app.database import get_db
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Budget])
def read_budgets(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_budgets(db, user_id=current_user.id, skip=skip, limit=limit)

@router.post("/", response_model=schemas.Budget)
def create_budget(
    budget: schemas.BudgetCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_budget(db=db, budget=budget, user_id=current_user.id)

@router.get("/{budget_id}", response_model=schemas.Budget)
def read_budget(
    budget_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_budget = crud.get_budget(db, budget_id=budget_id, user_id=current_user.id)
    if db_budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return db_budget

@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_budget = crud.delete_budget(db, budget_id=budget_id, user_id=current_user.id)
    if db_budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted successfully"}
