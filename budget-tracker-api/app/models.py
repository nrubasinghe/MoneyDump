from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String, index=True)
    amount = Column(Float)
    type = Column(String)  # income or expense
    category = Column(String)
    date = Column(String)  # Matching JSON "YYYY-MM-DD"
    merchant = Column(String, nullable=True)
    status = Column(String, default="completed")
    recurring = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="transactions")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    category = Column(String, index=True)
    limit = Column(Float)
    spent = Column(Float, default=0.0)
    color = Column(String, default="primary")
    status = Column(String, default="active")
    
    user = relationship("User", back_populates="budgets")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String, index=True)
    targetAmount = Column(Float)
    currentAmount = Column(Float, default=0.0)
    deadline = Column(String)
    color = Column(String, default="primary")
    icon = Column(String, default="Shield")
    
    user = relationship("User", back_populates="goals")

class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    period = Column(String)
    report_type = Column(String) # weekly/monthly
    score = Column(Integer)
    summary = Column(String)
    insights_json = Column(String) # Store as JSON string
    recommendations_json = Column(String) # Store as JSON string
    dateGenerated = Column(String)
    
    user = relationship("User", back_populates="analysis_reports")
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    transactions = relationship("Transaction", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    analysis_reports = relationship("AnalysisReport", back_populates="user")
