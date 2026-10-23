import sqlite3
import hashlib
import hmac
import secrets
import json
import time
from pathlib import Path
from typing import Optional, Dict, Any
from app.config import settings

DB_PATH = settings.GENERATED_DOCS_DIR / "scribeai.db"

def init_db():
    """Initialize SQLite database for users and authentication."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                avatar_url TEXT,
                provider TEXT NOT NULL DEFAULT 'local', -- 'local' or 'google'
                password_hash TEXT,
                salt TEXT,
                created_at REAL NOT NULL,
                last_login REAL NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at REAL NOT NULL,
                expires_at REAL NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        conn.commit()

def hash_password(password: str) -> tuple[str, str]:
    """Hash a password with a fresh random salt using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations=100_000
    ).hex()
    return hashed, salt

def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verify password against stored PBKDF2 hash."""
    test_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations=100_000
    ).hex()
    return hmac.compare_digest(test_hash, hashed)

def create_session(user_id: str, duration_seconds: int = 86400 * 30) -> str:
    """Generate a persistent session token for the user."""
    token = secrets.token_urlsafe(32)
    now = time.time()
    expires_at = now + duration_seconds
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, now, expires_at)
        )
        conn.commit()
    return token

def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    """Validate a session token and return user details."""
    now = time.time()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.email, u.name, u.avatar_url, u.provider, u.created_at, u.last_login
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > ?
        """, (token, now))
        row = cursor.fetchone()
        if row:
            return dict(row)
    return None

def register_user(email: str, name: str, password: str) -> Dict[str, Any]:
    """Register a new email/password user."""
    email = email.strip().lower()
    hashed, salt = hash_password(password)
    user_id = secrets.token_hex(8)
    now = time.time()

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (id, email, name, avatar_url, provider, password_hash, salt, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, email, name.strip(), None, "local", hashed, salt, now, now)
        )
        conn.commit()

    token = create_session(user_id)
    return {
        "user": {
            "id": user_id,
            "email": email,
            "name": name.strip(),
            "avatar_url": None,
            "provider": "local"
        },
        "token": token
    }

def login_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate an existing user with email and password."""
    email = email.strip().lower()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        if not row:
            return None

        user = dict(row)
        if user["provider"] != "local" or not user["password_hash"] or not user["salt"]:
            return None

        if not verify_password(password, user["password_hash"], user["salt"]):
            return None

        # Update last login
        now = time.time()
        cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (now, user["id"]))
        conn.commit()

    token = create_session(user["id"])
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatar_url": user["avatar_url"],
            "provider": user["provider"]
        },
        "token": token
    }

def get_or_create_google_user(email: str, name: str, avatar_url: Optional[str] = None) -> Dict[str, Any]:
    """Authenticate or register a user logging in via Google OAuth."""
    email = email.strip().lower()
    now = time.time()

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()

        if row:
            user = dict(row)
            cursor.execute("""
                UPDATE users 
                SET last_login = ?, name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url)
                WHERE id = ?
            """, (now, name, avatar_url, user["id"]))
            conn.commit()
            user_id = user["id"]
        else:
            user_id = secrets.token_hex(8)
            cursor.execute("""
                INSERT INTO users (id, email, name, avatar_url, provider, password_hash, salt, created_at, last_login)
                VALUES (?, ?, ?, ?, 'google', NULL, NULL, ?, ?)
            """, (user_id, email, name, avatar_url, now, now))
            conn.commit()

    token = create_session(user_id)
    return {
        "user": {
            "id": user_id,
            "email": email,
            "name": name,
            "avatar_url": avatar_url,
            "provider": "google"
        },
        "token": token
    }
