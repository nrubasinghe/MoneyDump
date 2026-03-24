import json
import os
from dotenv import load_dotenv
from app import models, crud, schemas
from app.database import SessionLocal, engine

load_dotenv()

def seed_db():
    db = SessionLocal()
    try:
        # 1. Ensure Demo Users Exist First
        demo_email = os.getenv("DEMO_EMAIL", "user@example.com")
        demo_password = os.getenv("DEMO_PASSWORD", "password123")
        
        primary_user = db.query(models.User).filter(models.User.email == demo_email).first()
        if not primary_user:
            primary_user = crud.create_user(db, schemas.UserCreate(email=demo_email, password=demo_password))
            print(f"Demo user created: {demo_email}")

        secondary_email = "user1@example.com"
        secondary_user = db.query(models.User).filter(models.User.email == secondary_email).first()
        if not secondary_user:
            secondary_user = crud.create_user(db, schemas.UserCreate(email=secondary_email, password=demo_password))
            print(f"Secondary user created: {secondary_email}")

        # 2. Seed Financial Data assigned to Primary Demo User
        user_id = primary_user.id
        
        if db.query(models.Transaction).count() == 0:
            with open("../BudgetTracker/src/data/transactions.json", "r") as f:
                transactions_data = json.load(f)
                for item in transactions_data:
                    if "id" in item: del item["id"]
                    db_transaction = models.Transaction(**item, user_id=user_id)
                    db.add(db_transaction)
            db.commit()
            print("Database seeded with initial transactions!")

        if db.query(models.Budget).count() == 0:
            with open("../BudgetTracker/src/data/budgets.json", "r") as f:
                budgets_data = json.load(f)
                for item in budgets_data:
                    if "id" in item: del item["id"]
                    db_budget = models.Budget(**item, user_id=user_id)
                    db.add(db_budget)
            db.commit()
            print("Database seeded with initial budgets!")

        if db.query(models.Goal).count() == 0:
            with open("../BudgetTracker/src/data/goals.json", "r") as f:
                goals_data = json.load(f)
                for item in goals_data:
                    if "id" in item: del item["id"]
                    db_goal = models.Goal(**item, user_id=user_id)
                    db.add(db_goal)
            db.commit()
            print("Database seeded with initial goals!")
            
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure tables are created
    models.Base.metadata.create_all(bind=engine)
    seed_db()
