"""
PulseSentiment SQLite Database Layer
Modular persistence for tweet analysis history.
"""

import sqlite3
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DB_DIR, "pulsesentiment.db")


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes the database schema if not already present."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tweet_text TEXT NOT NULL,
            sentiment TEXT NOT NULL,
            confidence REAL NOT NULL,
            probabilities TEXT NOT NULL,
            created_at TEXT NOT NULL,
            source TEXT DEFAULT 'manual'
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_sentiment ON analysis_history(sentiment)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_created_at ON analysis_history(created_at)")
    conn.commit()
    conn.close()


def save_analysis(tweet_text: str, sentiment: str, confidence: float, probabilities: str, source: str = "single") -> int:
    """Inserts a single analysis record."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO analysis_history (tweet_text, sentiment, confidence, probabilities, created_at, source)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (tweet_text, sentiment, confidence, probabilities, now_iso, source)
        )
        conn.commit()
        return cursor.lastrowid


def save_batch_analyses(records: List[Dict[str, Any]]) -> int:
    """Inserts multiple analysis records in a single transaction."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        data = [
            (
                r["tweet_text"],
                r["sentiment"],
                r["confidence"],
                r["probabilities"],
                r.get("created_at", now_iso),
                r.get("source", "batch")
            )
            for r in records
        ]
        cursor.executemany(
            """
            INSERT INTO analysis_history (tweet_text, sentiment, confidence, probabilities, created_at, source)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            data
        )
        conn.commit()
        return len(data)


def get_history(limit: int = 50, offset: int = 0, sentiment: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves paginated analysis history records."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if sentiment and sentiment.lower() != "all":
            cursor.execute(
                """
                SELECT id, tweet_text, sentiment, confidence, probabilities, created_at, source
                FROM analysis_history
                WHERE LOWER(sentiment) = LOWER(?)
                ORDER BY id DESC
                LIMIT ? OFFSET ?
                """,
                (sentiment, limit, offset)
            )
        else:
            cursor.execute(
                """
                SELECT id, tweet_text, sentiment, confidence, probabilities, created_at, source
                FROM analysis_history
                ORDER BY id DESC
                LIMIT ? OFFSET ?
                """,
                (limit, offset)
            )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_history_count(sentiment: Optional[str] = None) -> int:
    """Returns the total number of history records."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if sentiment and sentiment.lower() != "all":
            cursor.execute("SELECT COUNT(*) FROM analysis_history WHERE LOWER(sentiment) = LOWER(?)", (sentiment,))
        else:
            cursor.execute("SELECT COUNT(*) FROM analysis_history")
        return cursor.fetchone()[0]


def clear_history() -> int:
    """Deletes all records from analysis_history."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM analysis_history")
        conn.commit()
        return cursor.rowcount
