from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app import crud, schemas, models
from app.database import get_db
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=schemas.TransactionListResponse)
def read_transactions(
    skip: int = 0, 
    limit: int = 100, 
    type: str = None, 
    category: str = None, 
    search: str = None,
    sort_by: str = "date-desc",
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    items = crud.get_transactions(
        db, 
        user_id=current_user.id,
        skip=skip, 
        limit=limit, 
        transaction_type=type, 
        category=category, 
        search=search,
        sort_by=sort_by,
        year=year,
        month=month
    )
    total = crud.get_transactions_count(
        db, 
        user_id=current_user.id,
        transaction_type=type, 
        category=category, 
        search=search,
        year=year,
        month=month
    )
    return {"items": items, "total": total}

@router.post("/", response_model=schemas.Transaction)
def create_transaction(
    transaction: schemas.TransactionCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_transaction(db=db, transaction=transaction, user_id=current_user.id)

@router.get("/{transaction_id}", response_model=schemas.Transaction)
def read_transaction(
    transaction_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id, user_id=current_user.id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return db_transaction

@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_transaction = crud.delete_transaction(db, transaction_id=transaction_id, user_id=current_user.id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}
