from fastapi import APIRouter, HTTPException
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
