# MoneyDump: AI-Powered Financial Wellness Platform 💰🤖

MoneyDump is a next-generation financial management tool that eliminates the friction of manual expense tracking using Natural Language Processing (NLP) and provides expert financial coaching through a Dual-RAG (Retrieval-Augmented Generation) engine.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- An **OpenAI API Key** (or Gemini/Claude if configured)

### 2. Backend Setup (FastAPI)
Navigate to the API directory:
```bash
cd budget-tracker-api
```

Create and activate a virtual environment:
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

Install dependencies:
```bash
pip install fastapi uvicorn sqlalchemy chromadb langchain-text-splitters python-dotenv openai
```

Configure Environment Variables:
Create a `.env` file in the `budget-tracker-api` folder (or edit the existing one):
```env
OPENAI_API_KEY=your_key_here
DATABASE_URL=sqlite:///./budget.db
KNOWLEDGE_BASE_PATH=../knowledge_base
VECTOR_DB_PATH=../vector_db
SECRET_KEY=your_secret_key
```

Initialize & Seed the Database:
There are two ways to seed the database:
- **Fast Seed** (API directory): `python seed.py`
- **Full Demo Data** (Root directory): `python populate_db.py` (Indexes 3 months of history and generates reports).

Index the Knowledge Base (for Wealth Wisdom):
```bash
python -m app.rag_manager
```

Start the Backend Server:
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

---

### 3. Frontend Setup (React + Vite)
Open a new terminal and navigate to the frontend directory:
```bash
cd BudgetTracker
```

Install dependencies:
```bash
npm install
```

Start the Development Server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🧠 Key Features

- **MoneyDump Interface**: Log expenses, income, and goals by simply typing or speaking in natural language.
- **Wealth Wisdom (Expert RAG)**: A dedicated chat interface powered by 5 world-renowned financial bestsellers.
- **AI Auditor**: Get professional-grade audits of your spending with historical tracking and a 0-100 financial health score.
- **Multi-Theme UI**: Choose from premium themes like *Cyberpunk*, *Synthwave*, and *Emerald* (powered by DaisyUI).
- **Local-First Security**: API keys are stored in your browser, and financial data is handled securely via FastAPI.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, DaisyUI, Lucide React.
- **Backend**: Python, FastAPI, SQLAlchemy, ChromaDB (Vector Store).
- **AI**: OpenAI/Gemini/Ollama, LangChain (for RAG orchestration).

---

## 📄 MSc Project Documentation
For deeper insights into the project, refer to:
- [System Architecture](./System_Architecture.md)
- [Project Proposal](./Project_Proposal.md)
- [Presentation Slides](./Presentation_Slides.md)
