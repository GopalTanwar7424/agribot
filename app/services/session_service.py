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
        return session_id

    def get_session(self, session_id: str) -> Optional[dict]:
        with self._lock:
            session = self._store.get(session_id)
            if session:
                session["last_active"] = datetime.utcnow()
            return session

    def set_language(self, session_id: str, language: str) -> bool:
        with self._lock:
            if session_id in self._store:
                self._store[session_id]["language"] = language
                self._store[session_id]["last_active"] = datetime.utcnow()
                return True
        return False

    def add_message(self, session_id: str, role: str, content: str):
        with self._lock:
            if session_id not in self._store:
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

    def get_history(self, session_id: str) -> List[dict]:
        session = self.get_session(session_id)
        return session["messages"] if session else []

    def clear_history(self, session_id: str) -> bool:
        with self._lock:
            if session_id in self._store:
                self._store[session_id]["messages"] = []
                return True
        return False

    def delete_session(self, session_id: str) -> bool:
        with self._lock:
            if session_id in self._store:
                del self._store[session_id]
                return True
        return False

    def _cleanup_expired(self):
        ttl = timedelta(minutes=settings.session_ttl_minutes)
        now = datetime.utcnow()
        with self._lock:
            expired = [
                sid for sid, s in self._store.items()
                if now - s["last_active"] > ttl
            ]
            for sid in expired:
                del self._store[sid]

    def _start_cleanup(self):
        def run():
            import time
            while True:
                time.sleep(300)
                self._cleanup_expired()
        t = threading.Thread(target=run, daemon=True)
        t.start()

    def total_sessions(self) -> int:
        return len(self._store)


session_store = SessionStore()
