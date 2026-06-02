"""
fill_files.py
Run this once to fill all empty project files with correct code.
Command: python fill_files.py
"""

import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  filled: {path}")

print("\n Writing all project files...")

# ──────────────────────────────────────────────────────────────
# 1. app/__init__.py
# ──────────────────────────────────────────────────────────────
write_file("app/__init__.py", "# AgriBot Agriculture AI\n")

# ──────────────────────────────────────────────────────────────
# 2. app/config.py
# ──────────────────────────────────────────────────────────────
write_file("app/config.py", '''from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    gemini_api_key: str = ""
    app_name: str = "AgriBot"
    debug: bool = False
    upload_dir: str = "uploads"
    max_image_size_mb: int = 10
    max_history_turns: int = 20
    session_ttl_minutes: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
''')

# ──────────────────────────────────────────────────────────────
# 3. app/main.py
# ──────────────────────────────────────────────────────────────
write_file("app/main.py", '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import chat, voice, image, tts, session

app = FastAPI(
    title="AgriBot - Agriculture AI Chatbot",
    description="AI-powered agriculture assistant supporting Hindi, English, and Marathi",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(chat.router,    prefix="/api/chat",    tags=["Chat"])
app.include_router(voice.router,   prefix="/api/voice",   tags=["Voice to Text"])
app.include_router(image.router,   prefix="/api/image",   tags=["Image Analysis"])
app.include_router(tts.router,     prefix="/api/tts",     tags=["Text to Speech"])
app.include_router(session.router, prefix="/api/session", tags=["Session / History"])


@app.get("/")
async def root():
    return {
        "message": "AgriBot Agriculture AI is running!",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
''')

# ──────────────────────────────────────────────────────────────
# 4. app/models/__init__.py
# ──────────────────────────────────────────────────────────────
write_file("app/models/__init__.py", "")

# ──────────────────────────────────────────────────────────────
# 5. app/models/schemas.py
# ──────────────────────────────────────────────────────────────
write_file("app/models/schemas.py", '''from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

SUPPORTED_LANGUAGES = Literal["english", "hindi", "marathi"]


class LanguageSelectRequest(BaseModel):
    language: SUPPORTED_LANGUAGES


class LanguageSelectResponse(BaseModel):
    language: str
    greeting: str
    session_id: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    session_id: str
    message: str
    language: SUPPORTED_LANGUAGES = "english"


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    language: str
    suggestions: Optional[List[str]] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class VoiceTranscribeResponse(BaseModel):
    session_id: str
    transcript: str
    language: str
    confidence: Optional[float] = None


class ImageAnalysisRequest(BaseModel):
    session_id: str
    language: SUPPORTED_LANGUAGES = "english"
    additional_context: Optional[str] = ""


class ImageAnalysisResponse(BaseModel):
    session_id: str
    detected_issues: List[str]
    diagnosis: str
    treatment: str
    prevention: str
    severity: Literal["low", "medium", "high", "unknown"]
    language: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TTSRequest(BaseModel):
    text: str
    language: SUPPORTED_LANGUAGES = "english"


class TTSResponse(BaseModel):
    audio_url: str
    language: str
    duration_estimate_sec: Optional[float] = None


class SessionCreateResponse(BaseModel):
    session_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SessionHistoryResponse(BaseModel):
    session_id: str
    language: str
    messages: List[ChatMessage]
    total_messages: int


class SessionClearResponse(BaseModel):
    session_id: str
    message: str
''')

# ──────────────────────────────────────────────────────────────
# 6. app/services/__init__.py
# ──────────────────────────────────────────────────────────────
write_file("app/services/__init__.py", "")

# ──────────────────────────────────────────────────────────────
# 7. app/services/session_service.py
# ──────────────────────────────────────────────────────────────
write_file("app/services/session_service.py", '''import uuid
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
''')

# ──────────────────────────────────────────────────────────────
# 8. app/services/gemini_service.py
# ──────────────────────────────────────────────────────────────
write_file("app/services/gemini_service.py", '''import google.generativeai as genai
from app.config import get_settings
from app.services.session_service import session_store
from typing import List
import base64
import logging
import json
import re

logger = logging.getLogger(__name__)
settings = get_settings()


def _configure():
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY is not set in .env")
    genai.configure(api_key=settings.gemini_api_key)


SYSTEM_PROMPTS = {
    "english": """You are AgriBot, an expert AI agriculture assistant for Indian farmers.
Your role is to:
- Diagnose crop diseases, pest infestations, and soil issues
- Suggest organic and chemical treatments with dosage and timing
- Give advice on irrigation, fertilizers, and seasonal farming
- Provide government scheme information relevant to Indian farmers
- Answer in simple, clear English that a farmer can understand

Always structure your answer with:
1. Problem Identified
2. Cause
3. Treatment (step-by-step)
4. Prevention

Be concise, practical, and compassionate.""",

    "hindi": """Aap AgriBot hain, Bharatiya kisanon ke liye ek visheshagya AI krishi sahayak.
Aapki bhumika:
- Fasal rog, keet aur mitti ki samasyaon ka nidan karna
- Upchar aur khurak ki salah dena
- Sinchai, urvarak aur mausami kheti ki jankari dena
- Sarkari yojanaon ki jankari dena

Hamesha is prarup mein uttar den:
1. Samasya
2. Karan
3. Upchar (charan-dar-charan)
4. Bachav

Saral aur vyavaharik Hindi mein uttar den.""",

    "marathi": """Aapan AgriBot ahat, Bharatiya shetkaryansathi ek tajnya AI krushi sahayak.
Aapli bhumika:
- Pikanche rog, kid ani matichya samasyanche nidan karne
- Upchar ani pratibandhacha margadarshan karne
- Sinchan, khate ani hangami sheti chi mahiti dene
- Shasaniya yojananchi mahiti dene

Nehmi ya swarupat uttar dya:
1. Samasya
2. Karan
3. Upchar (payripayri)
4. Pratibandh

Sopya ani vyavaharik Marathit uttar dya."""
}

GREETINGS = {
    "english": "Hello! I am AgriBot, your personal agriculture assistant. How can I help you today? Please describe your crop problem or upload a photo.",
    "hindi":   "Namaste! Main AgriBot hun, aapka vyaktigat krishi sahayak. Aaj aapki kya sahayata karun? Apni fasal ki samasya batayein ya photo upload karein.",
    "marathi": "Namaskar! Mi AgriBot ahe, tumcha vaiyaktik krushi sahayak. Aaj mi tumhala kashi madat karu? Tumchya pikachi samasya sanga kinva photo upload kara."
}


def get_greeting(language: str) -> str:
    return GREETINGS.get(language, GREETINGS["english"])


def _build_history(session_id: str) -> list:
    session = session_store.get_session(session_id)
    if not session:
        return []
    history = []
    messages = session["messages"][:-1]
    for msg in messages[-settings.max_history_turns * 2:]:
        history.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]]
        })
    return history


async def chat_with_gemini(session_id: str, user_message: str, language: str) -> dict:
    _configure()
    system_prompt = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["english"])
    history = _build_history(session_id)

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_prompt
    )

    chat = model.start_chat(history=history)

    try:
        response = chat.send_message(user_message)
        reply_text = response.text
        suggestions = await _generate_suggestions(reply_text, language)
        return {"reply": reply_text, "suggestions": suggestions}
    except Exception as e:
        logger.error(f"Gemini chat error: {e}")
        raise


async def _generate_suggestions(reply: str, language: str) -> List[str]:
    _configure()
    prompts = {
        "english": f"Based on this agriculture advice:\\n{reply[:300]}\\n\\nGenerate exactly 3 short follow-up questions a farmer might ask (max 8 words each). Return as plain text, one per line, no numbering.",
        "hindi":   f"Is krishi salah ke aadhar par:\\n{reply[:300]}\\n\\nThik 3 chhote follow-up prashn banayein. Pratyek prashn nayi line par likhein.",
        "marathi": f"Ya krushi sallyachya aadhare:\\n{reply[:300]}\\n\\nNemke 3 chhote follow-up prashna tayar kara. Pratyek prashna navya olavar liha."
    }
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        result = model.generate_content(prompts.get(language, prompts["english"]))
        lines = [l.strip() for l in result.text.strip().split("\\n") if l.strip()]
        return lines[:3]
    except Exception:
        return []


IMAGE_ANALYSIS_PROMPT = """You are an expert agricultural plant pathologist.
Analyze this crop/plant image carefully and provide a diagnosis.

Return ONLY a JSON object with these exact keys:
{
  "detected_issues": ["issue1", "issue2"],
  "diagnosis": "detailed explanation of what you see",
  "treatment": "step-by-step treatment plan",
  "prevention": "how to prevent this in future",
  "severity": "low or medium or high or unknown"
}

If the image is not of a plant or crop, set severity to unknown and explain in diagnosis.
Return only the JSON, nothing else."""


async def analyze_image_with_gemini(
    image_bytes: bytes,
    mime_type: str,
    language: str,
    additional_context: str = ""
) -> dict:
    _configure()

    prompt = IMAGE_ANALYSIS_PROMPT
    if additional_context:
        prompt += f"\\n\\nAdditional context from farmer: {additional_context}"

    model = genai.GenerativeModel("gemini-1.5-flash")

    image_part = {
        "mime_type": mime_type,
        "data": base64.b64encode(image_bytes).decode("utf-8")
    }

    try:
        response = model.generate_content([prompt, image_part])
        raw = response.text.strip()

        json_match = re.search(r\'\\{.*\\}\', raw, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
        else:
            data = {
                "detected_issues": ["Could not parse response"],
                "diagnosis": raw,
                "treatment": "Please consult a local agricultural expert.",
                "prevention": "Monitor your crops regularly.",
                "severity": "unknown"
            }
        return data
    except Exception as e:
        logger.error(f"Gemini image analysis error: {e}")
        raise
''')

# ──────────────────────────────────────────────────────────────
# 9. app/services/voice_service.py
# ──────────────────────────────────────────────────────────────
write_file("app/services/voice_service.py", '''import speech_recognition as sr
import tempfile
import os
import logging

logger = logging.getLogger(__name__)

LANGUAGE_CODES = {
    "english": "en-IN",
    "hindi":   "hi-IN",
    "marathi": "mr-IN"
}


async def transcribe_audio(audio_bytes: bytes, audio_format: str, language: str = "english") -> dict:
    lang_code = LANGUAGE_CODES.get(language, "en-IN")
    recognizer = sr.Recognizer()

    suffix = f".{audio_format}"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        wav_path = tmp_path
        if audio_format.lower() not in ("wav",):
            wav_path = _convert_to_wav(tmp_path, audio_format)

        with sr.AudioFile(wav_path) as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio_data = recognizer.record(source)

        try:
            result = recognizer.recognize_google(audio_data, language=lang_code, show_all=True)
            if result and "alternative" in result:
                best = result["alternative"][0]
                return {
                    "transcript": best.get("transcript", ""),
                    "confidence": best.get("confidence", None),
                    "language": language
                }
            else:
                return {"transcript": "", "confidence": 0.0, "language": language}
        except sr.UnknownValueError:
            return {"transcript": "", "confidence": 0.0, "language": language}
        except sr.RequestError as e:
            raise RuntimeError(f"Speech recognition service unavailable: {e}")
    finally:
        try:
            os.unlink(tmp_path)
            if wav_path != tmp_path:
                os.unlink(wav_path)
        except Exception:
            pass


def _convert_to_wav(input_path: str, audio_format: str) -> str:
    try:
        from pydub import AudioSegment
        wav_path = input_path.rsplit(".", 1)[0] + ".wav"
        fmt = audio_format.lower().replace(".", "")
        audio = AudioSegment.from_file(input_path, format=fmt)
        audio.export(wav_path, format="wav")
        return wav_path
    except ImportError:
        raise RuntimeError("Audio conversion requires pydub. Run: pip install pydub")
    except Exception as e:
        raise RuntimeError(f"Could not convert audio: {e}")
''')

# ──────────────────────────────────────────────────────────────
# 10. app/services/tts_service.py
# ──────────────────────────────────────────────────────────────
write_file("app/services/tts_service.py", '''from gtts import gTTS
import os
import uuid
import logging
import re
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

TTS_LANG_CODES = {
    "english": "en",
    "hindi":   "hi",
    "marathi": "mr"
}


async def text_to_speech(text: str, language: str = "english") -> dict:
    lang_code = TTS_LANG_CODES.get(language, "en")

    if len(text) > 4000:
        text = text[:4000] + "..."

    clean_text = _clean_for_speech(text)

    filename = f"tts_{uuid.uuid4().hex[:12]}.mp3"
    output_dir = Path(settings.upload_dir) / "tts"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename

    try:
        tts = gTTS(text=clean_text, lang=lang_code, tld="co.in", slow=False)
        tts.save(str(output_path))

        word_count = len(clean_text.split())
        duration_estimate = (word_count / 150) * 60

        return {
            "audio_path": str(output_path),
            "audio_url": f"/uploads/tts/{filename}",
            "duration_estimate": round(duration_estimate, 1)
        }
    except Exception as e:
        logger.error(f"TTS generation error: {e}")
        raise RuntimeError(f"Text-to-speech failed: {e}")


def _clean_for_speech(text: str) -> str:
    text = re.sub(r\'\\*+([^*]+)\\*+\', r\'\\1\', text)
    text = re.sub(r\'^#+\\s+\', \'\', text, flags=re.MULTILINE)
    text = re.sub(r\'^[-•]\\s+\', \'\', text, flags=re.MULTILINE)
    text = re.sub(r\'^\\d+\\.\\s+\', \'\', text, flags=re.MULTILINE)
    text = re.sub(r\'https?://\\S+\', \'\', text)
    text = re.sub(r\'\\n{3,}\', \'\\n\\n\', text)
    return text.strip()
''')

# ──────────────────────────────────────────────────────────────
# 11. app/routers/__init__.py
# ──────────────────────────────────────────────────────────────
write_file("app/routers/__init__.py", "")

# ──────────────────────────────────────────────────────────────
# 12. app/routers/chat.py
# ──────────────────────────────────────────────────────────────
write_file("app/routers/chat.py", '''from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse, LanguageSelectRequest, LanguageSelectResponse
from app.services.gemini_service import chat_with_gemini, get_greeting
from app.services.session_service import session_store
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/language", response_model=LanguageSelectResponse)
async def select_language(body: LanguageSelectRequest):
    session_id = session_store.create_session(language=body.language)
    greeting = get_greeting(body.language)
    session_store.add_message(session_id, "assistant", greeting)
    return LanguageSelectResponse(
        language=body.language,
        greeting=greeting,
        session_id=session_id
    )


@router.post("/message", response_model=ChatResponse)
async def send_message(body: ChatRequest):
    session = session_store.get_session(body.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please start a new session by selecting a language."
        )

    session_store.add_message(body.session_id, "user", body.message)

    try:
        result = await chat_with_gemini(
            session_id=body.session_id,
            user_message=body.message,
            language=body.language
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable. Please try again.")

    session_store.add_message(body.session_id, "assistant", result["reply"])

    return ChatResponse(
        session_id=body.session_id,
        reply=result["reply"],
        language=body.language,
        suggestions=result.get("suggestions", [])
    )
''')

# ──────────────────────────────────────────────────────────────
# 13. app/routers/voice.py
# ──────────────────────────────────────────────────────────────
write_file("app/routers/voice.py", '''from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import VoiceTranscribeResponse
from app.services.voice_service import transcribe_audio
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_AUDIO_TYPES = {
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/x-wav": "wav",
}


@router.post("/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_voice(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    language: str = Form(default="english")
):
    audio_bytes = await audio.read()
    size_mb = len(audio_bytes) / (1024 * 1024)
    if size_mb > 10:
        raise HTTPException(status_code=413, detail=f"Audio file too large ({size_mb:.1f} MB). Maximum: 10 MB")

    content_type = audio.content_type or ""
    audio_format = ALLOWED_AUDIO_TYPES.get(content_type)

    if not audio_format:
        filename = audio.filename or ""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        fmt_map = {"wav": "wav", "webm": "webm", "ogg": "ogg", "mp3": "mp3", "m4a": "m4a"}
        audio_format = fmt_map.get(ext, "wav")

    try:
        result = await transcribe_audio(
            audio_bytes=audio_bytes,
            audio_format=audio_format,
            language=language
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail="Voice transcription failed.")

    if not result["transcript"]:
        raise HTTPException(status_code=422, detail="Could not understand audio. Please speak clearly and try again.")

    return VoiceTranscribeResponse(
        session_id=session_id,
        transcript=result["transcript"],
        language=language,
        confidence=result.get("confidence")
    )
''')

# ──────────────────────────────────────────────────────────────
# 14. app/routers/image.py
# ──────────────────────────────────────────────────────────────
write_file("app/routers/image.py", '''from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import ImageAnalysisResponse
from app.services.gemini_service import analyze_image_with_gemini
from app.services.session_service import session_store
from app.config import get_settings
import uuid
import logging
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpeg",
    "image/jpg":  "jpeg",
    "image/png":  "png",
    "image/webp": "webp",
}


@router.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_crop_image(
    image: UploadFile = File(...),
    session_id: str = Form(...),
    language: str = Form(default="english"),
    additional_context: str = Form(default="")
):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    image_bytes = await image.read()
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > settings.max_image_size_mb:
        raise HTTPException(status_code=413, detail=f"Image too large ({size_mb:.1f} MB).")

    content_type = image.content_type or "image/jpeg"
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image format. Use JPEG, PNG, or WebP.")

    upload_dir = Path(settings.upload_dir) / "images"
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = ALLOWED_IMAGE_TYPES[content_type]
    filename = f"img_{uuid.uuid4().hex[:12]}.{ext}"
    save_path = upload_dir / filename
    with open(save_path, "wb") as f:
        f.write(image_bytes)

    try:
        result = await analyze_image_with_gemini(
            image_bytes=image_bytes,
            mime_type=content_type,
            language=language,
            additional_context=additional_context
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail="Image analysis failed. Please try again.")

    issues_str = ", ".join(result.get("detected_issues", [])) or "No specific issues detected"
    summary = f"[Image Analysis] Detected: {issues_str}. Severity: {result.get(\'severity\', \'unknown\').upper()}"
    session_store.add_message(session_id, "user", summary)
    session_store.add_message(session_id, "assistant",
        f"Diagnosis: {result.get(\'diagnosis\', \'\')}\\n\\nTreatment: {result.get(\'treatment\', \'\')}"
    )

    return ImageAnalysisResponse(
        session_id=session_id,
        detected_issues=result.get("detected_issues", []),
        diagnosis=result.get("diagnosis", ""),
        treatment=result.get("treatment", ""),
        prevention=result.get("prevention", ""),
        severity=result.get("severity", "unknown"),
        language=language
    )
''')

# ──────────────────────────────────────────────────────────────
# 15. app/routers/tts.py
# ──────────────────────────────────────────────────────────────
write_file("app/routers/tts.py", '''from fastapi import APIRouter, HTTPException
from app.models.schemas import TTSRequest, TTSResponse
from app.services.tts_service import text_to_speech
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/speak", response_model=TTSResponse)
async def speak_text(body: TTSRequest):
    if not body.text or not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if len(body.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long. Maximum 5000 characters.")

    try:
        result = await text_to_speech(text=body.text, language=body.language)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail="Text-to-speech service unavailable.")

    return TTSResponse(
        audio_url=result["audio_url"],
        language=body.language,
        duration_estimate_sec=result.get("duration_estimate")
    )
''')

# ──────────────────────────────────────────────────────────────
# 16. app/routers/session.py
# ──────────────────────────────────────────────────────────────
write_file("app/routers/session.py", '''from fastapi import APIRouter, HTTPException
from app.models.schemas import SessionCreateResponse, SessionHistoryResponse, SessionClearResponse, ChatMessage
from app.services.session_service import session_store
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/new", response_model=SessionCreateResponse)
async def create_session():
    session_id = session_store.create_session()
    return SessionCreateResponse(session_id=session_id)


@router.get("/{session_id}/history", response_model=SessionHistoryResponse)
async def get_session_history(session_id: str):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = [
        ChatMessage(
            role=m["role"],
            content=m["content"],
            timestamp=datetime.fromisoformat(m["timestamp"])
        )
        for m in session["messages"]
    ]

    return SessionHistoryResponse(
        session_id=session_id,
        language=session.get("language", "english"),
        messages=messages,
        total_messages=len(messages)
    )


@router.delete("/{session_id}/history", response_model=SessionClearResponse)
async def clear_session_history(session_id: str):
    success = session_store.clear_history(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionClearResponse(session_id=session_id, message="Conversation history cleared.")


@router.delete("/{session_id}", response_model=SessionClearResponse)
async def delete_session(session_id: str):
    success = session_store.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionClearResponse(session_id=session_id, message="Session deleted.")


@router.get("/stats/active")
async def active_sessions():
    return {"active_sessions": session_store.total_sessions()}
''')

# ──────────────────────────────────────────────────────────────
# Done!
# ──────────────────────────────────────────────────────────────
print("\n All 16 files written successfully!")
print("\n Now run:")
print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
print("\n Then open: http://localhost:8000/docs\n")