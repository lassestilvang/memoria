import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "memoria.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Tables for sessions, fragments, and summaries
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fragments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            category TEXT,
            content TEXT,
            context TEXT,
            audio_url TEXT,
            embedding BLOB,
            is_verified BOOLEAN DEFAULT 0,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS summaries (
            session_id TEXT PRIMARY KEY,
            content TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS synthesized_narrative (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS memory_seeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            is_used BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Migration: Add columns if they don't exist
    cursor.execute("PRAGMA table_info(fragments)")
    columns = [col[1] for col in cursor.fetchall()]
    if "embedding" not in columns:
        cursor.execute("ALTER TABLE fragments ADD COLUMN embedding BLOB")
    if "is_verified" not in columns:
        cursor.execute("ALTER TABLE fragments ADD COLUMN is_verified BOOLEAN DEFAULT 0")
    if "audio_url" not in columns:
        cursor.execute("ALTER TABLE fragments ADD COLUMN audio_url TEXT")
    
    conn.commit()
    conn.close()

def save_session(session_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO sessions (id) VALUES (?)", (session_id,))
    conn.commit()
    conn.close()

def save_fragment(session_id, category, content, context="", embedding=None, audio_url=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO fragments (session_id, category, content, context, embedding, audio_url, is_verified) 
        VALUES (?, ?, ?, ?, ?, ?, 0)
    """, (session_id, category, content, context, embedding, audio_url))
    conn.commit()
    conn.close()

def save_summary(session_id, content):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO summaries (session_id, content) 
        VALUES (?, ?)
    """, (session_id, content))
    conn.commit()
    conn.close()

def get_all_fragments(verified_only=True):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if verified_only:
        cursor.execute("SELECT category, content, context, embedding, id, audio_url FROM fragments WHERE is_verified = 1")
    else:
        cursor.execute("SELECT category, content, context, embedding, id, is_verified, audio_url FROM fragments")
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_pending_fragments():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, category, content, context, audio_url FROM fragments WHERE is_verified = 0")
    rows = cursor.fetchall()
    conn.close()
    return rows

def verify_fragment(fragment_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE fragments SET is_verified = 1 WHERE id = ?", (fragment_id,))
    conn.commit()
    conn.close()

def update_fragment(fragment_id, content, category=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if category:
        cursor.execute("UPDATE fragments SET content = ?, category = ? WHERE id = ?", (content, category, fragment_id))
    else:
        cursor.execute("UPDATE fragments SET content = ? WHERE id = ?", (content, fragment_id))
    conn.commit()
    conn.close()

def delete_fragment(fragment_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM fragments WHERE id = ?", (fragment_id,))
    conn.commit()
    conn.close()

def save_seed(content):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO memory_seeds (content) VALUES (?)", (content,))
    conn.commit()
    conn.close()

def get_active_seeds():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, content FROM memory_seeds WHERE is_used = 0")
    rows = cursor.fetchall()
    conn.close()
    return rows

def save_synthesized_narrative(content):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO synthesized_narrative (content) VALUES (?)", (content,))
    conn.commit()
    conn.close()

def get_latest_synthesized_narrative():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM synthesized_narrative ORDER BY created_at DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

if __name__ == "__main__":
    init_db()
    print("Database initialized at", DB_PATH)
