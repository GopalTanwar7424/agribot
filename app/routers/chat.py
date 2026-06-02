from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse, LanguageSelectRequest, LanguageSelectResponse
from app.services.groq_service import chat_with_groq, get_greeting
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
        result = await chat_with_groq(
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
