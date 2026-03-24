from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.database import engine
from app import models

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BudgetTracker API (Structured)")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Root route
@app.get("/")
def root():
    return {"message": "Welcome to BudgetTracker API v2 (Simplified Structure)"}

# Include all routers
app.include_router(api_router, prefix="/api/v1")
# For compatibility with existing UI if it points to /transactions
app.include_router(api_router)
