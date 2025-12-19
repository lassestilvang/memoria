import sqlite3
import os
from database import DB_PATH, init_db

def verify_db():
    print(f"Checking database at: {DB_PATH}")
    if os.path.exists(DB_PATH):
        # We might want to remove it for a clean test of init_db
        # But for now let's just inspect
        pass
    
    init_db()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    print(f"Tables found: {tables}")
    
    required_tables = ["sessions", "fragments", "summaries", "memory_seeds"]
    for table in required_tables:
        assert table in tables, f"Table {table} missing!"
        
    # Check fragments columns
    cursor.execute("PRAGMA table_info(fragments);")
    columns = [c[1] for c in cursor.fetchall()]
    print(f"Fragments columns: {columns}")
    assert "embedding" in columns, "Column 'embedding' missing from fragments!"
    
    print("Database verification SUCCESSFUL!")
    conn.close()

if __name__ == "__main__":
    verify_db()
