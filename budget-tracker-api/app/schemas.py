from pydantic import BaseModel
from typing import Optional

class TransactionBase(BaseModel):
    title: str
    amount: float
    type: str
    category: str
    date: str
    merchant: Optional[str] = None
    status: Optional[str] = "completed"
    recurring: Optional[bool] = False

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    items: list[Transaction]
    total: int

# Budget Schemas
class BudgetBase(BaseModel):
    category: str
    limit: float
    spent: float = 0.0
    color: str = "primary"
    status: str = "active"

class BudgetCreate(BudgetBase):
    pass

class Budget(BudgetBase):
    id: int

    class Config:
        from_attributes = True

# Goal Schemas
class GoalBase(BaseModel):
    title: str
    targetAmount: float
    currentAmount: float = 0.0
    deadline: str
    color: str = "primary"
    icon: str = "Shield"

class GoalCreate(GoalBase):
    pass

class Goal(GoalBase):
    id: int

    class Config:
        from_attributes = True

class BulkCreate(BaseModel):
    transactions: list[TransactionCreate]
    goals: list[GoalCreate]
    budgets: list[BudgetCreate]
class AnalysisReportBase(BaseModel):
    period: str
    report_type: str
    score: int
    summary: str
    insights_json: str
    recommendations_json: str
    dateGenerated: str

class AnalysisReportCreate(AnalysisReportBase):
    pass

class AnalysisReport(AnalysisReportBase):
    id: int

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
