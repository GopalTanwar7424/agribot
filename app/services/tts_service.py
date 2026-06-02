from gtts import gTTS
from app.config import get_settings
import os
import uuid
import logging
import re

logger = logging.getLogger(__name__)
settings = get_settings()


def clean_text_for_tts(text: str, language: str) -> str:
    """Clean text for TTS"""
    
    # Remove markdown
    clean = text.replace("**", "").replace("*", "").replace("_", "")
    
    # Replace English words
    if language in ["hindi", "marathi"]:
        clean = clean.replace("AgriBot", "एग्रीबॉट")
    
    # Remove punctuation
    for char in ':.,-;!?()[]{}/"\'`•→—–\\|@#$%^&+=<>~':
        clean = clean.replace(char, ' ')
    
    # CRITICAL FIX: Convert numbers to words for Marathi/Hindi
    if language in ["hindi", "marathi"]:
        number_words = {
            '0': 'शून्य', '1': 'एक', '2': 'दोन' if language == 'marathi' else 'दो',
            '3': 'तीन', '4': 'चार', '5': 'पाच' if language == 'marathi' else 'पांच',
            '6': 'सहा' if language == 'marathi' else 'छह', '7': 'सात',
            '8': 'आठ', '9': 'नऊ' if language == 'marathi' else 'नौ'
        }
        
        # Replace each digit
        for digit, word in number_words.items():
            clean = clean.replace(digit, word)
    
    # Clean spaces
    clean = ' '.join(clean.split())
    
    logger.info(f"Cleaned text: {clean[:200]}")
    
    return clean


async def text_to_speech(text: str, language: str) -> dict:
    """Generate speech from text using gTTS"""
    try:
        # Clean text
        clean_text = clean_text_for_tts(text, language)
        
        if not clean_text or len(clean_text) < 3:
            raise ValueError("Text too short")
        
        # Force Hindi voice for all Devanagari
        if language in ["hindi", "marathi"]:
            lang = "hi"
            tld = "co.in"
        else:
            lang = "en"
            tld = "com"
        
        logger.info(f"TTS: {language} -> lang={lang}, tld={tld}")
        logger.info(f"Text preview: {clean_text[:150]}")
        
        # Create directory
        output_dir = os.path.join(settings.upload_dir, "tts")
        os.makedirs(output_dir, exist_ok=True)
        
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(output_dir, filename)
        
        # Generate audio - force lang_check=False to prevent language detection issues
        tts = gTTS(text=clean_text, lang=lang, tld=tld, slow=False, lang_check=False)
        tts.save(filepath)
        
        logger.info(f"Audio saved: {filepath}")
        
        return {
            "audio_url": f"/uploads/tts/{filename}",
            "language": language,
            "duration_seconds": max(3, len(clean_text) // 10)
        }
    
    except Exception as e:
        logger.error(f"TTS Error: {e}")
        raise