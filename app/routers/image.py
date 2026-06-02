from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import ImageAnalysisResponse
from app.services.groq_service import analyze_image_with_groq
from app.services.session_service import session_store
from app.config import get_settings
import uuid
import logging
from pathlib import Path
import re

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
    # ✅ CLEAN THE ADDITIONAL CONTEXT EARLY
    cleaned_context = re.sub(r'[\n\r\t]+', ' ', additional_context).strip()
    
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
        # ✅ PASS CLEANED CONTEXT
        result = await analyze_image_with_groq(
            image_bytes=image_bytes,
            mime_type=content_type,
            language=language,
            additional_context=cleaned_context
        )
    except ValueError as e:
        logger.error(f"ValueError in image analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail="Image analysis failed. Please try again.")

    issues_str = ", ".join(result.get("detected_issues", [])) or "No specific issues detected"
    summary = f"[Image Analysis] Detected: {issues_str}. Severity: {result.get('severity', 'unknown').upper()}"
    session_store.add_message(session_id, "user", summary)
    session_store.add_message(session_id, "assistant",
        f"Diagnosis: {result.get('diagnosis', '')}\n\nTreatment: {result.get('treatment', '')}"
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