import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from app.config import get_settings
import threading
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class SessionStore:
    def __init__(self):
        self._store: Dict[str, dict] = {}
        self._lock = threading.Lock()
        self._start_cleanup()

    def create_session(self, language: str = "english") -> str:
        session_id = str(uuid.uuid4())
        with self._lock:
            self._store[session_id] = {
                "session_id": session_id,
                "language": language,
                "messages": [],
                "created_at": datetime.utcnow(),
                "last_active": datetime.utcnow()
            }
        logger.info(f"Created session: {session_id} with language: {language}")
        return session_id

    def get_session(self, session_id: str) -> Optional[dict]:
        with self._lock:
            session = self._store.get(session_id)
            if session:
                session["last_active"] = datetime.utcnow()
                logger.debug(f"Session {session_id} accessed, updated last_active")
            else:
                logger.warning(f"Session {session_id} not found")
            return session

    def set_language(self, session_id: str, language: str) -> bool:
        with self._lock:
            if session_id in self._store:
                self._store[session_id]["language"] = language
                self._store[session_id]["last_active"] = datetime.utcnow()
                logger.info(f"Updated language for session {session_id}: {language}")
                return True
        logger.warning(f"Failed to set language for session {session_id}: session not found")
        return False

    def add_message(self, session_id: str, role: str, content: str):
        with self._lock:
            if session_id not in self._store:
                logger.warning(f"Cannot add message to session {session_id}: session not found")
                return
            session = self._store[session_id]
            session["messages"].append({
                "role": role,
                "content": content,
                "timestamp": datetime.utcnow().isoformat()
            })
            max_msgs = settings.max_history_turns * 2
            if len(session["messages"]) > max_msgs:
                session["messages"] = session["messages"][-max_msgs:]
            session["last_active"] = datetime.utcnow()
            logger.debug(f"Added {role} message to session {session_id}")

    def get_history(self, session_id: str) -> List[dict]:
        session = self.get_session(session_id)
        return session["messages"] if session else []

    def clear_history(self, session_id: str) -> bool:
        with self._lock:
            if session_id in self._store:
                self._store[session_id]["messages"] = []
                self._store[session_id]["last_active"] = datetime.utcnow()
                logger.info(f"Cleared history for session {session_id}")
                return True
        logger.warning(f"Failed to clear history for session {session_id}: session not found")
        return False

    def delete_session(self, session_id: str) -> bool:
        with self._lock:
            if session_id in self._store:
                del self._store[session_id]
                logger.info(f"Deleted session {session_id}")
                return True
        logger.warning(f"Failed to delete session {session_id}: session not found")
        return False

    def _cleanup_expired(self):
        ttl = timedelta(minutes=settings.session_ttl_minutes)
        now = datetime.utcnow()
        with self._lock:
            expired = [
                sid for sid, s in self._store.items()
                if now - s["last_active"] > ttl
            ]
            if expired:
                logger.info(f"Cleaning up {len(expired)} expired sessions")
            for sid in expired:
                logger.debug(f"Deleting expired session: {sid}")
                del self._store[sid]

    def _start_cleanup(self):
        def run():
            import time
            while True:
                time.sleep(300)  # Run every 5 minutes
                try:
                    self._cleanup_expired()
                except Exception as e:
                    logger.error(f"Error in session cleanup: {e}")
        t = threading.Thread(target=run, daemon=True)
        t.start()
        logger.info("Session cleanup thread started")

    def total_sessions(self) -> int:
        with self._lock:
            return len(self._store)

    # ✅ NEW METHOD - Check if session exists without updating last_active
    def session_exists(self, session_id: str) -> bool:
        with self._lock:
            return session_id in self._store


session_store = SessionStore()