import os
import logging
from gtts import gTTS
import uuid
from pathlib import Path
from app.config import get_settings
import tempfile

logger = logging.getLogger(__name__)
settings = get_settings()

# For Groq-based transcription
from groq import Groq

async def transcribe_voice(audio_bytes: bytes, audio_format: str, language: str = "english") -> dict:
    """
    Transcribe audio bytes using Groq Whisper API
    Groq accepts many formats directly, no conversion needed!
    """
    try:
        logger.info(f"Starting transcription, format: {audio_format}, language: {language}")
        
        # Map language to Groq format
        lang_map = {
            "english": "en",
            "hindi": "hi",
            "marathi": "mr"
        }
        groq_language = lang_map.get(language, "en")
        
        # Save audio to temporary file with correct extension
        # Groq supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
        temp_file = tempfile.NamedTemporaryFile(
            delete=False, 
            suffix=f".{audio_format}"
        )
        
        try:
            # Write audio bytes to temp file
            temp_file.write(audio_bytes)
            temp_file.close()
            
            logger.info(f"Saved audio to temp file: {temp_file.name}")
            
            # Use Groq Whisper API for transcription
            client = Groq(api_key=settings.groq_api_key)
            
            with open(temp_file.name, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=(f"audio.{audio_format}", audio_file.read()),
                    model="whisper-large-v3",
                    language=groq_language,
                    response_format="text"
                )
            
            # Extract transcript text
            transcript = transcription if isinstance(transcription, str) else transcription.text
            
            # Clean up temp file
            os.unlink(temp_file.name)
            
            logger.info(f"Transcription successful: {transcript[:50]}...")
            
            return {
                "transcript": transcript.strip(),
                "language": language,
                "confidence": 1.0
            }
            
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
            logger.error(f"Groq transcription error: {str(e)}")
            raise Exception(f"Transcription failed: {str(e)}")
            
    except Exception as e:
        logger.error(f"Voice transcription error: {str(e)}")
        raise Exception(f"Voice transcription failed: {str(e)}")


async def text_to_speech(text: str, language: str = "english") -> dict:
    """
    Convert text to speech using gTTS
    """
    try:
        # Map language codes
        lang_map = {
            "english": "en",
            "hindi": "hi",
            "marathi": "mr"
        }
        
        lang_code = lang_map.get(language, "en")
        
        # Generate audio
        tts = gTTS(text=text, lang=lang_code, slow=False)
        
        # Save to uploads/tts directory
        tts_dir = Path(settings.upload_dir) / "tts"
        tts_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"{uuid.uuid4()}.mp3"
        filepath = tts_dir / filename
        
        tts.save(str(filepath))
        
        return {
            "audio_url": f"/uploads/tts/{filename}",
            "language": language
        }
        
    except Exception as e:
        logger.error(f"Text-to-speech error: {str(e)}")
        raise Exception(f"Text-to-speech failed: {str(e)}")