from sqlalchemy.orm import Session
from . import models, schemas

def get_transactions(
    db: Session, 
    user_id: int,
    skip: int = 0, 
    limit: int = 100, 
    transaction_type: str = None, 
    category: str = None, 
    search: str = None,
    sort_by: str = "date-desc",
    year: int = None,
    month: int = None
):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == user_id)

    
    if transaction_type and transaction_type != 'all':
        query = query.filter(models.Transaction.type == transaction_type)
    
    if category and category != 'all':
        query = query.filter(models.Transaction.category == category)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Transaction.title.ilike(search_filter)) | 
            (models.Transaction.merchant.ilike(search_filter))
        )
        
    if year:
        year_filter = f"{year}-%"
        query = query.filter(models.Transaction.date.like(year_filter))
    
    if month:
        # Format month as 01, 02, etc.
        month_str = f"{month:02}"
        if year:
            month_filter = f"{year}-{month_str}-%"
            query = query.filter(models.Transaction.date.like(month_filter))
        else:
            month_filter = f"%-{month_str}-%"
            query = query.filter(models.Transaction.date.like(month_filter))
        
    # Sorting logic
    if sort_by == "date-desc":
        query = query.order_by(models.Transaction.date.desc(), models.Transaction.id.desc())
    elif sort_by == "date-asc":
        query = query.order_by(models.Transaction.date.asc(), models.Transaction.id.asc())
    elif sort_by == "amount-desc":
        query = query.order_by(models.Transaction.amount.desc())
    elif sort_by == "amount-asc":
        query = query.order_by(models.Transaction.amount.asc())
    else:
        query = query.order_by(models.Transaction.date.desc())
        
    return query.offset(skip).limit(limit).all()

def get_transactions_count(
    db: Session, 
    user_id: int,
    transaction_type: str = None, 
    category: str = None, 
    search: str = None,
    year: int = None,
    month: int = None
):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == user_id)

    
    if transaction_type and transaction_type != 'all':
        query = query.filter(models.Transaction.type == transaction_type)
    
    if category and category != 'all':
        query = query.filter(models.Transaction.category == category)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Transaction.title.ilike(search_filter)) | 
            (models.Transaction.merchant.ilike(search_filter))
        )
        
    if year:
        year_filter = f"{year}-%"
        query = query.filter(models.Transaction.date.like(year_filter))
    
    if month:
        month_str = f"{month:02}"
        if year:
            month_filter = f"{year}-{month_str}-%"
            query = query.filter(models.Transaction.date.like(month_filter))
        else:
            month_filter = f"%-{month_str}-%"
            query = query.filter(models.Transaction.date.like(month_filter))
        
    return query.count()

def create_transaction(db: Session, transaction: schemas.TransactionCreate, user_id: int):
    db_transaction = models.Transaction(**transaction.dict(), user_id=user_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_transaction(db: Session, transaction_id: int, user_id: int):
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.user_id == user_id).first()

def delete_transaction(db: Session, transaction_id: int, user_id: int):
    print(f"DEBUG: Attempting to delete transaction ID: {transaction_id} for user {user_id}")
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.user_id == user_id).first()

    if db_transaction:
        print(f"DEBUG: Found transaction: {db_transaction.title}. Deleting...")
        db.delete(db_transaction)
        db.commit()
        print("DEBUG: Transaction deleted and committed.")
    else:
        print(f"DEBUG: Transaction ID {transaction_id} not found.")
    return db_transaction

# Budget CRUD
def get_budgets(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Budget).filter(models.Budget.user_id == user_id).order_by(models.Budget.id.desc()).offset(skip).limit(limit).all()

def create_budget(db: Session, budget: schemas.BudgetCreate, user_id: int):
    db_budget = models.Budget(**budget.dict(), user_id=user_id)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def get_budget(db: Session, budget_id: int, user_id: int):
    return db.query(models.Budget).filter(models.Budget.id == budget_id, models.Budget.user_id == user_id).first()

def delete_budget(db: Session, budget_id: int, user_id: int):
    db_budget = db.query(models.Budget).filter(models.Budget.id == budget_id, models.Budget.user_id == user_id).first()
    if db_budget:
        db.delete(db_budget)
        db.commit()
    return db_budget


# Goal CRUD
def get_goals(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Goal).filter(models.Goal.user_id == user_id).order_by(models.Goal.id.desc()).offset(skip).limit(limit).all()

def create_goal(db: Session, goal: schemas.GoalCreate, user_id: int):
    db_goal = models.Goal(**goal.dict(), user_id=user_id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def get_goal(db: Session, goal_id: int, user_id: int):
    return db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == user_id).first()

def delete_goal(db: Session, goal_id: int, user_id: int):
    db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == user_id).first()
    if db_goal:
        db.delete(db_goal)
        db.commit()
    return db_goal


def bulk_create(db: Session, transactions: list[schemas.TransactionCreate], goals: list[schemas.GoalCreate], budgets: list[schemas.BudgetCreate], user_id: int):
    db_transactions = []
    for t in transactions:
        db_t = models.Transaction(**t.dict(), user_id=user_id)
        db.add(db_t)
        db_transactions.append(db_t)

    db_goals = []
    for g in goals:
        db_g = models.Goal(**g.dict(), user_id=user_id)
        db.add(db_g)
        db_goals.append(db_g)

    db_budgets = []
    for b in budgets:
        db_b = models.Budget(**b.dict(), user_id=user_id)
        db.add(db_b)
        db_budgets.append(db_b)


    db.commit()
    for t in db_transactions:
        db.refresh(t)
    for g in db_goals:
        db.refresh(g)
    for b in db_budgets:
        db.refresh(b)

    return {"transactions": db_transactions, "goals": db_goals, "budgets": db_budgets}

# Analysis Report CRUD
def get_analysis_reports(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.AnalysisReport).filter(models.AnalysisReport.user_id == user_id).order_by(models.AnalysisReport.dateGenerated.desc(), models.AnalysisReport.id.desc()).offset(skip).limit(limit).all()

def create_analysis_report(db: Session, report: schemas.AnalysisReportCreate, user_id: int):
    db_report = models.AnalysisReport(**report.dict(), user_id=user_id)
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def delete_analysis_report(db: Session, report_id: int, user_id: int):
    db_report = db.query(models.AnalysisReport).filter(models.AnalysisReport.id == report_id, models.AnalysisReport.user_id == user_id).first()
    if db_report:
        db.delete(db_report)
        db.commit()
    return db_report


# User CRUD & Auth Utilities
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
