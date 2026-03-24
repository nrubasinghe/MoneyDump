from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
import os
from dotenv import load_dotenv
import json
from datetime import datetime
from app import models
from app.api.v1.endpoints.auth import get_current_user

# Load environment variables
load_dotenv()

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class MoneyDumpRequest(BaseModel):
    text: str

class MoneyDumpResponse(BaseModel):
    expenses: list
    income: list
    goals: list
    budgets: list

@router.post("/process", response_model=MoneyDumpResponse)
async def process_money_dump(request: MoneyDumpRequest):
    if not request.text.strip():
        return {"expenses": [], "income": [], "goals": [], "budgets": []}

    today = datetime.now().strftime("%Y-%m-%d")

    prompt = f"""
    You are a professional financial assistant. 
    Analyze the following raw text input which contains financial activities (expenses, income, savings goals, or budget limits).
    Extract all distinct items and return them ONLY in raw JSON format.
    
    The JSON structure MUST be:
    {{
        "expenses": [
            {{ "title": "...", "amount": 0.0, "category": "Housing/Utilities/Food & Dining/Transportation/Health & Medical/Insurance/Personal & Fun/Debt & Loans/Savings & Investing/Giving/Misc", "date": "YYYY-MM-DD", "merchant": "..." }}
        ],
        "income": [
            {{ "title": "...", "amount": 0.0, "category": "Salary/Freelance/Gift/Investment/Other", "date": "YYYY-MM-DD" }}
        ],
        "goals": [
            {{ "title": "...", "targetAmount": 0.0, "deadline": "YYYY-MM-DD" }}
        ],
        "budgets": [
            {{ "category": "...", "limit": 0.0, "color": "primary/secondary/accent/info/success/warning/error" }}
        ]
    }}

    Rules:
    1. For expenses, try to identify a merchant if mentioned (e.g. 'Lunch at Walmart' -> merchant 'Walmart').
    2. Use today's date ({today}) for items where no date is specified.
    3. Categorize accurately into one of the provided categories.
    4. If no amount is given for a goal, default to 0.
    5. For budgets, extract the spending limit for a category (e.g. 'Set a $500 budget for food' -> category 'Food', limit 500).
    6. Ensure numbers are floats.
    7. Return ONLY the JSON object. No markdown, no triple backticks.

    Input text: "{request.text}"
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a specialized financial data extractor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            response_format={ "type": "json_object" }
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        # Ensure all arrays exist
        return {
            "expenses": data.get("expenses", []),
            "income": data.get("income", []),
            "goals": data.get("goals", []),
            "budgets": data.get("budgets", [])
        }

    except Exception as e:
        print(f"Error processing with OpenAI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from sqlalchemy.orm import Session
from fastapi import Depends
from app.database import SessionLocal
from app import crud, schemas

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/confirm")
async def confirm_money_dump(
    payload: schemas.BulkCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        return crud.bulk_create(db, payload.transactions, payload.goals, payload.budgets, user_id=current_user.id)
    except Exception as e:
        print(f"Error confirming bulk save: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class AdvisorRequest(BaseModel):
    query: str

from app.rag_manager import RAGManager

rag = RAGManager()

@router.post("/query")
async def query_financial_advisor(request: AdvisorRequest):
    # RAG Logic: Similarity search in ChromaDB
    context = rag.query(request.query, n_results=5)
    
    if not context:
        context = "No relevant context found in the knowledge base. Use general financial expertise."

    prompt = f"""
    You are a World-Class Financial Expert AI. 
    You have access to specific context from curated financial bestsellers (summarized below).
    Answer the user's question by prioritizing the logic found in the context (Ramit Sethi, Dave Ramsey, Morgan Housel, Vicki Robin).
    
    CONTEXT FROM KNOWLEDGE BASE (RANKED BY RELEVANCE):
    {context}
    
    USER QUESTION:
    "{request.query}"
    
    INSTRUCTIONS:
    1. If the context contains a direct answer or strategy (e.g. 'Baby Steps', 'Real Hourly Wage', 'Conscious Spending'), explain it clearly.
    2. Synthesize advice from multiple books if relevant.
    3. If the answer is not in the context, provide your best general advice but note that it's from general knowledge.
    4. Use a professional, encouraging, and clear tone.
    5. Format with Markdown (bolding, lists, headers).
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional financial advisor powered by a Vector-RAG system."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        print(f"Error in RAG advisor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class AnalysisRequest(BaseModel):
    budgets: list
    transactions: list
    analysisType: str = "monthly"
    period: Optional[str] = None

@router.post("/analyze")
async def analyze_finances(
    request: AnalysisRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # RAG Logic: Search for concepts related to their current financial situation
    search_query = f"Financial audit for {len(request.budgets)} budgets and {len(request.transactions)} transactions. Issues like overspending or savings goals."
    context = rag.query(search_query, n_results=10)

    # Prepare user data for prompt
    # Calculate more precise stats to help the AI be less "generic"
    total_budget = sum([b.get('limit', 0) for b in request.budgets])
    total_spent = sum([b.get('spent', 0) for b in request.budgets])
    overspent_categories = [b.get('category') for b in request.budgets if b.get('spent', 0) > b.get('limit', 0)]
    
    user_summary = f"""
    CALCULATED FINANCIAL STATS:
    - Total Budget Limit: {total_budget}
    - Total Amount Spent: {total_spent}
    - Budget Utilization: {(total_spent / total_budget * 100) if total_budget > 0 else 0:.1f}%
    - Overspent Categories: {', '.join(overspent_categories) if overspent_categories else 'None'}
    
    DETAILED DATA:
    Budgets: {json.dumps(request.budgets, indent=2)}
    Recent Transactions: {json.dumps(request.transactions[:20], indent=2)}
    """

    prompt = f"""
    You are a Strategic Financial Analyst. 
    Analyze the user's current financial situation using the data provided AND the curated knowledge base context retrieved via similarity search.
    
    KNOWLEDGE BASE (VECTOR RAG CONTEXT):
    {context}
    
    USER DATA AND STATS:
    {user_summary}
    
    ANALYSIS TYPE: {request.analysisType}
    
    OBJECTIVE:
    Provide a professional financial analysis report in JSON format only.
    Use the philosophies found in the knowledge base (e.g. Ramsey's Baby Steps, Sethi's Conscious Spending, etc.) to evaluate their data.
    
    SCORING CALCULATION RULES (MULTI-FACTOR BEHAVIORAL):
    1. FILTERED ONLY: You are ONLY analyzing the specific transactions provided in the 'USER DATA' list. 
    2. RAW GRADE: Start at 90.
    3. PENALTIES (BE PRECISE):
       - -1 point for every 2% of budget used globally.
       - -7 points for every overspent category.
       - -12 points if Total Spent > Total Income for THIS PERIOD.
       - -5 points if more than 30% of transactions are 'Entertainment' or 'Fun'.
    4. REWARDS:
       - +5 points if 'Savings' goal transactions exist in this period.
       - +3 points if they stopped spending in a category before hitting 100%.
    5. UNIQUENESS: No two reports should ever be identical. Even with the same data, find a different behavioral nuance to critique (e.g., 'consistency of daily leaks' vs 'one-off large luxury spikes').
    6. FORBIDDEN: Strictly forbidden from returning exactly 82, 75, 65, or 50. Use precise, non-rounded integers like 61, 74, 86, 43, etc.
    
    REQUIRED JSON STRUCTURE:
    {{
        "score": (calculated integer),
        "summary": "A high-level executive summary focusing on THIS SPECIFIC PERIOD.",
        "insights": [
            {{ "type": "alert|warning|success|info", "text": "Unique observation about their behavior this month/week." }}
        ],
        "recommendations": [
            "Actionable advice tailored to the specific transactions found."
        ]
    }}
    
    Return ONLY JSON. No markdown.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional financial auditor and advisor using Vector-RAG."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={ "type": "json_object" }
        )
        data = json.loads(response.choices[0].message.content)
        
        # Save to database
        # Use provided period from request if available, else default to current month/year
        report_period = getattr(request, 'period', datetime.now().strftime("%B %Y"))
        if not report_period:
             report_period = datetime.now().strftime("%B %Y")
        
        db_report = schemas.AnalysisReportCreate(
            period=report_period,
            report_type=request.analysisType,
            score=data.get("score", 0),
            summary=data.get("summary", ""),
            insights_json=json.dumps(data.get("insights", [])),
            recommendations_json=json.dumps(data.get("recommendations", [])),
            dateGenerated=datetime.now().strftime("%Y-%m-%d")
        )
        saved_report = crud.create_analysis_report(db, db_report, user_id=current_user.id)

        
        # Return the saved report structure
        return {
            "id": saved_report.id,
            "period": saved_report.period,
            "type": saved_report.report_type,
            "score": saved_report.score,
            "summary": saved_report.summary,
            "insights": json.loads(saved_report.insights_json),
            "recommendations": json.loads(saved_report.recommendations_json),
            "dateGenerated": saved_report.dateGenerated
        }
    except Exception as e:
        print(f"Error in RAG analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports")
async def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reports = crud.get_analysis_reports(db, user_id=current_user.id)
    return [
        {
            "id": r.id,
            "period": r.period,
            "type": r.report_type,
            "score": r.score,
            "summary": r.summary,
            "insights": json.loads(r.insights_json),
            "recommendations": json.loads(r.recommendations_json),
            "dateGenerated": r.dateGenerated
        } for r in reports
    ]

@router.delete("/reports/{report_id}")
async def delete_analysis_history(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    success = crud.delete_analysis_report(db, report_id=report_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"status": "deleted"}
