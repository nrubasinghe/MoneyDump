import os
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models
from app.database import SessionLocal, engine
from dotenv import load_dotenv

load_dotenv()

def refresh_data():
    db = SessionLocal()
    try:
        # 1. Identify Demo User
        demo_email = os.getenv("DEMO_EMAIL", "user@example.com")
        user = db.query(models.User).filter(models.User.email == demo_email).first()
        
        if not user:
            print(f"Error: User {demo_email} not found.")
            return

        user_id = user.id
        print(f"Refreshing DEEP realistic data for {demo_email}...")

        # 2. Clear existing dynamic data
        db.query(models.Transaction).filter(models.Transaction.user_id == user_id).delete()
        db.query(models.Budget).filter(models.Budget.user_id == user_id).delete()
        db.query(models.Goal).filter(models.Goal.user_id == user_id).delete()
        db.query(models.AnalysisReport).filter(models.AnalysisReport.user_id == user_id).delete()
        db.commit()

        # 3. Create realistic Budgets (current month)
        # We'll use 8 categories for a fuller board
        budgets = [
            {"category": "Food & Dining", "limit": 550, "color": "primary"},
            {"category": "Transportation", "limit": 180, "color": "secondary"},
            {"category": "Personal & Fun", "limit": 250, "color": "accent"},
            {"category": "Housing & Bills", "limit": 1400, "color": "info"},
            {"category": "Health & Medical", "limit": 120, "color": "success"},
            {"category": "Debt & Loans", "limit": 400, "color": "warning"},
            {"category": "Insurance", "limit": 150, "color": "error"},
            {"category": "Misc", "limit": 100, "color": "neutral"},
        ]
        for b in budgets:
            db_budget = models.Budget(**b, user_id=user_id, spent=0, status="active")
            db.add(db_budget)
        
        # 4. Create realistic Goals (long term)
        goals = [
            {"title": "Rainy Day Fund", "targetAmount": 10000, "currentAmount": 6420, "deadline": "2026-12-30", "icon": "Shield", "color": "primary"},
            {"title": "Iceland Trip", "targetAmount": 3500, "currentAmount": 2800, "deadline": "2026-06-15", "icon": "Plane", "color": "accent"},
            {"title": "BMW Deposit", "targetAmount": 5000, "currentAmount": 450, "deadline": "2027-01-01", "icon": "Car", "color": "info"},
            {"title": "MacBook Pro", "targetAmount": 2400, "currentAmount": 2400, "deadline": "2025-11-01", "icon": "Laptop", "color": "success"}, # Completed goal
        ]
        for g in goals:
            db_goal = models.Goal(**g, user_id=user_id)
            db.add(db_goal)

        # 5. Generate 12 months of Transactions (extremely real)
        # From April 2025 to March 2026
        start_dt = datetime(2025, 4, 1)
        today = datetime(2026, 3, 5) 

        merchants = {
            "Food & Dining": ["Waitrose", "Tesco", "UberEats", "Starbucks", "Pret A Manger", "Pizza Express", "Local Butcher", "Deli Shop"],
            "Transportation": ["Shell", "Uber", "Trainline", "TFL Pay", "Eurotunnel", "Avis Rental"],
            "Personal & Fun": ["Amazon", "Nike Store", "Apple Online", "Vue Cinema", "Udemy", "Blizzard Ent", "ASOS", "John Lewis"],
            "Housing & Bills": ["British Gas", "Thames Water", "EE Mobile", "Virgin Media", "Council Tax Portal", "Electricity Board"],
            "Health & Medical": ["Boots", "CVS", "Local Pharmacy", "Specsavers", "Bupa Insurance"],
            "Debt & Loans": ["Student Loans Co", "Barclays Bank", "Credit Card Payment"],
            "Insurance": ["Admiral Insurance", "Direct Line", "Pet Plan"],
            "Misc": ["Hardware Store", "Post Office", "Charity Donation", "Dry Cleaners"]
        }

        print("Writing 12-month ledger...")
        
        days = (today - start_dt).days
        for i in range(days + 1):
            curr = start_dt + timedelta(days=i)
            dt_str = curr.strftime("%Y-%m-%d")

            # --- MONTHLY INCOME ---
            if curr.day == 1:
                db.add(models.Transaction(user_id=user_id, title="Salary - Full Month", amount=4250.0, type="income", category="Salary", date=dt_str, merchant="Global Corp Inc"))
            
            # --- FIXED MONTHLY COSTS ---
            if curr.day == 2:
                db.add(models.Transaction(user_id=user_id, title="Monthly Rent", amount=1150.0, type="expense", category="Housing & Bills", date=dt_str, merchant="Apartment Agency"))
            if curr.day == 3:
                # Car loan
                db.add(models.Transaction(user_id=user_id, title="Car Finance Payment", amount=320.0, type="expense", category="Debt & Loans", date=dt_str, merchant="VW Finance"))
            if curr.day == 5:
                # Council Tax
                db.add(models.Transaction(user_id=user_id, title="Council Tax", amount=165.0, type="expense", category="Housing & Bills", date=dt_str, merchant="Local Council"))
            
            # Subscriptions on various days
            if curr.day == 10:
                db.add(models.Transaction(user_id=user_id, title="Prime Membership", amount=8.99, type="expense", category="Personal & Fun", date=dt_str, merchant="Amazon"))
            if curr.day == 15:
                db.add(models.Transaction(user_id=user_id, title="Spotify Family", amount=17.99, type="expense", category="Personal & Fun", date=dt_str, merchant="Spotify"))
                db.add(models.Transaction(user_id=user_id, title="Broadband + TV", amount=55.0, type="expense", category="Housing & Bills", date=dt_str, merchant="Virgin Media"))
            if curr.day == 20:
                db.add(models.Transaction(user_id=user_id, title="Gym Membership", amount=45.0, type="expense", category="Personal & Fun", date=dt_str, merchant="PureGym"))
            
            # --- VARIABLE DAILY LIFE ---
            
            # Coffee (High frequency)
            if random.random() < 0.4:
                db.add(models.Transaction(user_id=user_id, title="Morning Coffee", amount=random.uniform(3.5, 6.0), type="expense", category="Food & Dining", date=dt_str, merchant=random.choice(["Starbucks", "Pret A Manger"])))
            
            # Lunch
            if random.random() < 0.3:
                db.add(models.Transaction(user_id=user_id, title="Lunch Break", amount=random.uniform(9, 16), type="expense", category="Food & Dining", date=dt_str, merchant=random.choice(["Tesco", "Waitrose", "Leon"])))

            # Groceries (Big shop on Friday/Saturday)
            grocery_chance = 0.5 if curr.weekday() in [4, 5] else 0.05
            if random.random() < grocery_chance:
                 db.add(models.Transaction(user_id=user_id, title="Weekly Grocery", amount=random.uniform(60, 110), type="expense", category="Food & Dining", date=dt_str, merchant=random.choice(["Waitrose", "Tesco"])))

            # Transportation (Commute)
            if curr.weekday() < 5 and random.random() < 0.8:
                db.add(models.Transaction(user_id=user_id, title="Commute (TFL)", amount=8.40, type="expense", category="Transportation", date=dt_str, merchant="TFL Pay"))

            # Weekend Fun
            if curr.weekday() >= 5 and random.random() < 0.4:
                db.add(models.Transaction(user_id=user_id, title="Weekend Outing/Dinner", amount=random.uniform(40, 150), type="expense", category="Personal & Fun", date=dt_str, merchant=random.choice(merchants["Personal & Fun"])))

            # Random Misc
            if random.random() < 0.05:
                db.add(models.Transaction(user_id=user_id, title="General Purchase", amount=random.uniform(10, 80), type="expense", category="Misc", date=dt_str, merchant=random.choice(merchants["Misc"])))

            # --- GUARANTEED EXCEEDED RECORD FOR DEMO ---
            # Add a large 'Personal & Fun' spike on March 4th 2026
            if dt_str == "2026-03-04":
                db.add(models.Transaction(
                    user_id=user_id,
                    title="High-End Designer Headphones",
                    amount=299.0,
                    type="expense",
                    category="Personal & Fun",
                    date=dt_str,
                    merchant="Apple Store"
                ))
            
            # Add a large 'Transportation' spike on March 3rd 2026
            if dt_str == "2026-03-03":
                db.add(models.Transaction(
                    user_id=user_id,
                    title="Main Car Service & Repairs",
                    amount=220.0,
                    type="expense",
                    category="Transportation",
                    date=dt_str,
                    merchant="Auto Repair Workshop"
                ))

            # --- SEASONAL/BIG SPIKES ---
            # Christmas December 2025
            if curr.month == 12 and curr.day in [15, 18, 20]:
                db.add(models.Transaction(user_id=user_id, title="Holiday Gift Shopping", amount=random.uniform(200, 450), type="expense", category="Personal & Fun", date=dt_str, merchant="Amazon / John Lewis"))
            
            # Holiday Bookings
            if curr.month == 1 and curr.day == 5:
                db.add(models.Transaction(user_id=user_id, title="Flight to Reykjavik", amount=650.0, type="expense", category="Transportation", date=dt_str, merchant="IcelandAir"))
            
            # Insurance Annual
            if curr.month == 9 and curr.day == 1:
                db.add(models.Transaction(user_id=user_id, title="Car Insurance (Annual)", amount=580.0, type="expense", category="Insurance", date=dt_str, merchant="Direct Line"))

        db.commit()
        print(f"Sync complete. 12 months of high-fidelity data loaded for '{demo_email}'.")

    except Exception as e:
        print(f"Critical error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    refresh_data()
