import os
import chromadb
from chromadb.utils import embedding_functions
from langchain_text_splitters import MarkdownHeaderTextSplitter
from dotenv import load_dotenv

load_dotenv()

# Base directory: two levels up from this file (budget-tracker-api/)
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration — use env vars, fall back to paths relative to the project root
KB_PATH = os.getenv("KNOWLEDGE_BASE_PATH") or os.path.join(_BASE_DIR, "knowledge_base")
DB_PATH = os.getenv("VECTOR_DB_PATH") or os.path.join(_BASE_DIR, "vector_db")
COLLECTION_NAME = "budget_wisdom"

# Validate required credentials
_openai_key = os.getenv("OPENAI_API_KEY")
if not _openai_key:
    raise EnvironmentError(
        "OPENAI_API_KEY is not set. Please add it to your .env file."
    )

# Embedding Function
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key=_openai_key,
    model_name="text-embedding-3-small"
)

class RAGManager:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=DB_PATH)
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=openai_ef
        )

    def index_knowledge_base(self):
        """Processes and indexes all markdown files in the knowledge base."""
        if not os.path.exists(KB_PATH):
            print(f"Knowledge base path {KB_PATH} not found.")
            return

        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]
        markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)

        for filename in os.listdir(KB_PATH):
            if filename.endswith(".md"):
                file_path = os.path.join(KB_PATH, filename)
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
                
                # Split by headers to preserve context
                sections = markdown_splitter.split_text(text)
                
                documents = []
                metadatas = []
                ids = []

                for i, section in enumerate(sections):
                    documents.append(section.page_content)
                    # Add source and any headers found as metadata
                    metadata = section.metadata
                    metadata["source"] = filename
                    metadatas.append(metadata)
                    ids.append(f"{filename}_{i}")

                # Add to collection (Chroma handles upserts by ID if we use .upsert)
                self.collection.upsert(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas
                )
                print(f"Indexed {len(sections)} chunks from {filename}")

    def query(self, text, n_results=5):
        """Searches the vector database for relevant content."""
        results = self.collection.query(
            query_texts=[text],
            n_results=n_results
        )
        
        # Combine the results into a single context string
        context = ""
        for i, doc in enumerate(results['documents'][0]):
            source = results['metadatas'][0][i].get('source', 'Unknown')
            context += f"\n--- Source: {source} ---\n{doc}\n"
            
        return context

# Initialize and index when this module is run directly
if __name__ == "__main__":
    manager = RAGManager()
    manager.index_knowledge_base()
    print("Indexing complete.")
