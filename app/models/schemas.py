from pydantic import BaseModel, Field
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
