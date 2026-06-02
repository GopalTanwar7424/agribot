from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import VoiceTranscribeResponse
from app.services.voice_service import transcribe_voice as transcribe_audio_service  # RENAMED IMPORT
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
async def transcribe_voice_endpoint(  # RENAMED ENDPOINT FUNCTION
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
        result = await transcribe_audio_service(  # CALL THE IMPORTED FUNCTION
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