from groq import Groq
from app.config import get_settings
from app.services.session_service import session_store
from typing import List
import logging
import json
import re
import base64
import google.generativeai as genai
import PIL.Image
import io

logger = logging.getLogger(__name__)
settings = get_settings()

MODEL = "llama-3.1-8b-instant"
VISION_MODEL = "llama-3.2-90b-vision-preview"


def _get_client():
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is not set in .env")
    return Groq(api_key=settings.groq_api_key)


SYSTEM_PROMPTS = {
    "english": """You are AgriBot, an expert AI agriculture assistant for Indian farmers.

Your role is to provide helpful, practical farming advice on:
- Crop cultivation, planting, and soil recommendations
- Plant disease diagnosis (ONLY when symptoms are described)
- Pest control and fertilizer guidance
- Irrigation, weather-based farming tips
- Government schemes for Indian farmers

IMPORTANT GUIDELINES:
1. Answer the farmer's ACTUAL question - don't assume they're reporting a disease unless they describe symptoms
2. For soil questions: recommend soil types, pH levels, composition, and preparation
3. For planting questions: provide spacing, depth, timing, watering, and care instructions
4. For disease diagnosis: ONLY diagnose when farmer describes symptoms like yellowing, spots, wilting, bugs, holes, etc.
5. Keep answers practical for Indian farming conditions
6. Use simple, clear English that farmers can understand

CRITICAL: Do NOT use markdown formatting (**, _, etc.). Write in plain text only.

Response Format:
- For disease diagnosis (when symptoms mentioned): Problem Identified, Cause, Treatment (step-by-step), Prevention
- For all other questions: Answer naturally and directly with practical advice

Be concise, practical, and compassionate.""",

    "hindi": """आप AgriBot हैं, भारतीय किसानों के लिए एक विशेषज्ञ AI कृषि सहायक।

आपकी भूमिका व्यावहारिक खेती सलाह देना:
- फसल लगाना, मिट्टी की सिफारिशें
- पौधों की बीमारी का निदान (केवल जब लक्षण बताए जाएं)
- कीट नियंत्रण और उर्वरक मार्गदर्शन
- सिंचाई, मौसम आधारित खेती
- सरकारी योजनाएं

महत्वपूर्ण दिशानिर्देश:
1. किसान के वास्तविक प्रश्न का उत्तर दें - जब तक लक्षण न बताए जाएं, बीमारी मत मानें
2. मिट्टी के प्रश्नों के लिए: मिट्टी के प्रकार, pH स्तर, संरचना, तैयारी बताएं
3. रोपण प्रश्नों के लिए: दूरी, गहराई, समय, पानी, देखभाल बताएं
4. केवल तभी बीमारी का निदान करें जब किसान पीलापन, धब्बे, मुरझाना, कीड़े, छेद आदि बताए
5. भारतीय खेती के लिए व्यावहारिक सलाह दें
6. सरल हिंदी में उत्तर दें जो किसान समझ सकें

महत्वपूर्ण: देवनागरी लिपि में हिंदी में उत्तर दें। मार्कडाउन फॉर्मेटिंग न करें।

उत्तर प्रारूप:
- बीमारी निदान के लिए (जब लक्षण बताए जाएं): समस्या, कारण, उपचार (चरणबद्ध), बचाव
- अन्य प्रश्नों के लिए: सीधे और व्यावहारिक सलाह दें

संक्षिप्त, व्यावहारिक और दयालु रहें।""",

    "marathi": """तुम्ही AgriBot आहात, भारतीय शेतकऱ्यांसाठी तज्ञ AI कृषी सहायक।

तुमची भूमिका व्यावहारिक शेती सल्ला देणे:
- पीक लागवड, मातीच्या शिफारसी
- वनस्पती रोग निदान (केवळ जेव्हा लक्षणे सांगितली जातात)
- किडक नियंत्रण आणि खत मार्गदर्शन
- सिंचन, हवामान आधारित शेती
- शासकीय योजना

महत्त्वाचे मार्गदर्शक तत्त्वे:
1. शेतकऱ्याच्या वास्तविक प्रश्नाचे उत्तर द्या - लक्षणे सांगितल्याशिवाय रोग नको गृहीत धरू
2. मातीच्या प्रश्नांसाठी: माती प्रकार, pH पातळी, रचना, तयारी सांगा
3. लागवडीच्या प्रश्नांसाठी: अंतर, खोली, वेळ, पाणी, काळजी सांगा
4. केवळ जेव्हा शेतकरी पिवळसरपणा, डाग, कोमेजणे, किडे, छिद्रे वगैरे सांगतो तेव्हाच रोग निदान करा
5. भारतीय शेतीसाठी व्यावहारिक सल्ला द्या
6. सोप्या मराठीत उत्तर द्या जे शेतकरी समजू शकतात

महत्त्वाचे: देवनागरी लिपीत मराठी मध्ये उत्तर द्या. मार्कडाउन फॉरमॅटिंग नको।

उत्तर स्वरूप:
- रोग निदानासाठी (जेव्हा लक्षणे सांगितली जातात): समस्या, कारण, उपचार (पायरीपायरी), प्रतिबंध
- इतर प्रश्नांसाठी: थेट आणि व्यावहारिक सल्ला द्या

संक्षिप्त, व्यावहारिक आणि दयाळू राहा।"""
}


GREETINGS = {
    "english": "Hello! I am AgriBot, your personal agriculture assistant. How can I help you today? Please describe your crop problem or upload a photo.",
    "hindi":   "नमस्ते! मैं AgriBot हूं, आपकी व्यक्तिगत कृषि सहायक। आज मैं आपकी क्या सहायता कर सकती हूं? अपनी फसल की समस्या बताएं या फोटो अपलोड करें।",
    "marathi": "नमस्कार! मी AgriBot आहे, तुमची वैयक्तिक कृषी सहायक। आज मी तुम्हाला कशी मदत करू? तुमच्या पिकाची समस्या सांगा किंवा फोटो अपलोड करा।"
}


def get_greeting(language: str) -> str:
    return GREETINGS.get(language, GREETINGS["english"])


def _build_history(session_id: str) -> list:
    session = session_store.get_session(session_id)
    if not session:
        return []
    messages = session["messages"][:-1]
    history = []
    for msg in messages[-settings.max_history_turns * 2:]:
        history.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    return history


async def chat_with_groq(session_id: str, user_message: str, language: str) -> dict:
    client = _get_client()
    system_prompt = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["english"])
    history = _build_history(session_id)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )
        reply_text = response.choices[0].message.content
        suggestions = await _generate_suggestions(reply_text, language)
        return {"reply": reply_text, "suggestions": suggestions}
    except Exception as e:
        logger.error(f"Groq chat error: {e}")
        raise


async def _generate_suggestions(reply: str, language: str) -> List[str]:
    client = _get_client()
    prompts = {
        "english": f"Based on this agriculture advice:\n{reply[:300]}\n\nGenerate exactly 3 short follow-up questions a farmer might ask (max 8 words each). Return as plain text, one per line, no numbering.",
        "hindi":   f"इस कृषि सलाह के आधार पर:\n{reply[:300]}\n\nठीक 3 छोटे अनुवर्ती प्रश्न बनाएं (प्रत्येक अधिकतम 8 शब्द)। प्रत्येक प्रश्न नई पंक्ति पर लिखें, कोई क्रमांकन नहीं। केवल देवनागरी लिपि में लिखें।",
        "marathi": f"या कृषी सल्ल्याच्या आधारे:\n{reply[:300]}\n\nनेमके 3 लहान फॉलो-अप प्रश्न तयार करा (प्रत्येक जास्तीत जास्त 8 शब्द). प्रत्येक प्रश्न नव्या ओळीवर लिहा, क्रमांकन नको। फक्त देवनागरी लिपीत लिहा."
    }
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{
                "role": "user",
                "content": prompts.get(language, prompts["english"])
            }],
            max_tokens=200
        )
        text = response.choices[0].message.content
        lines = [l.strip() for l in text.strip().split("\n") if l.strip()]
        return lines[:3]
    except Exception:
        return []


def _clean_text(text: str) -> str:
    """Remove control characters and clean text for JSON parsing."""
    if not text:
        return ""
    cleaned = re.sub(r'[\n\r\t]+', ' ', text)
    cleaned = re.sub(r'[^\x20-\x7E\u0900-\u097F]', '', cleaned)
    cleaned = ' '.join(cleaned.split())
    return cleaned.strip()


async def analyze_image_with_groq(
    image_bytes: bytes,
    mime_type: str,
    language: str,
    additional_context: str = ""
) -> dict:
    """Analyze plant image using Google Gemini Vision"""
    
    # Configure Gemini
    if not settings.gemini_api_key:
        logger.error("GEMINI_API_KEY not set")
        return {
            "detected_issues": ["Vision API not configured"],
            "diagnosis": "Image analysis requires GEMINI_API_KEY. Get free key from https://aistudio.google.com/app/apikey and add to .env file.",
            "treatment": "For now, please describe your plant symptoms in text.",
            "prevention": "Regular plant monitoring",
            "severity": "unknown",
            "followup_questions": []
        }
    
    # Initialize client
    
    
    cleaned_context = _clean_text(additional_context)
    
    # Build prompt based on language
    if language == "english":
        if cleaned_context:
            prompt = f"""You are an expert agricultural botanist helping Indian farmers.

The farmer asks: "{cleaned_context}"

Analyze this plant image carefully and return ONLY valid JSON with NO HTML, NO colors, NO special formatting:

{{
  "detected_issues": ["issue1", "issue2"],
  "diagnosis": "Plant: [botanical and common name]. What I observe: [detailed visible symptoms]. Confidence level: [high/medium/low]",
  "treatment": "Treatment steps as plain numbered list:\\n1. First step with complete details\\n2. Second step with complete details\\n3. Third step with complete details\\nUse \\n for line breaks between steps. NO HTML. NO colors. NO special formatting.",
  "prevention": "Prevention tips as plain numbered list:\\n1. First prevention tip\\n2. Second prevention tip\\n3. Third prevention tip\\nUse \\n for line breaks. NO HTML. NO colors.",
  "severity": "low or medium or high",
  "followup_questions": ["Specific question 1?", "Specific question 2?", "Specific question 3?"]
}}

CRITICAL RULES:
- Write treatment and prevention as simple numbered lists
- Use actual newline characters (\\n) between numbered items
- NO HTML tags (no <b>, no colors, no styling)
- Numbers must be directly attached to their text: "1. Description" not "1.\\nDescription"
- Keep it simple and readable

Be honest about uncertainty. Ask follow-up questions to improve accuracy."""
        else:
            prompt = """You are an expert agricultural botanist. Analyze this plant image.

Return ONLY valid JSON with NO HTML, NO colors, NO special formatting:

{
  "detected_issues": ["visible issues if any"],
  "diagnosis": "Plant identification: [name]. Health assessment: [description of what you see]",
  "treatment": "Treatment as plain numbered list:\\n1. First step\\n2. Second step\\n3. Third step\\nNO HTML. NO colors.",
  "prevention": "Prevention as plain numbered list:\\n1. First tip\\n2. Second tip\\n3. Third tip\\nNO HTML. NO colors.",
  "severity": "low or medium or high or healthy",
  "followup_questions": ["When did symptoms start?", "Other plants affected?", "Recent weather changes?"]
}

CRITICAL: Use simple plain text. Numbers attached to text: "1. Description" not "1.\\nDescription". NO HTML tags."""

    elif language == "hindi":
        prompt = f"""आप कृषि विशेषज्ञ हैं। {"किसान पूछता है: " + cleaned_context if cleaned_context else "इस पौधे की छवि का विश्लेषण करें।"}

JSON में उत्तर दें (कोई HTML नहीं, कोई रंग नहीं):
{{
  "detected_issues": ["समस्या1", "समस्या2"],
  "diagnosis": "पौधा: [नाम]। दिखाई दे रहा है: [विवरण]",
  "treatment": "उपचार के कदम सूची:\\n1. पहला कदम\\n2. दूसरा कदम\\n3. तीसरा कदम\\nकोई HTML नहीं।",
  "prevention": "बचाव सूची:\\n1. पहला उपाय\\n2. दूसरा उपाय\\n3. तीसरा उपाय",
  "severity": "low या medium या high",
  "followup_questions": ["प्रश्न 1?", "प्रश्न 2?"]
}}"""

    else:  # Marathi
        prompt = f"""तुम्ही कृषी तज्ञ आहात। {"शेतकरी विचारतो: " + cleaned_context if cleaned_context else "या वनस्पतीच्या प्रतिमेचे विश्लेषण करा।"}

JSON मध्ये उत्तर द्या (HTML नाही, रंग नाही):
{{
  "detected_issues": ["समस्या1", "समस्या2"],
  "diagnosis": "वनस्पती: [नाव]। दिसत आहे: [वर्णन]",
  "treatment": "उपचार यादी:\\n1. पहिली पायरी\\n2. दुसरी पायरी\\n3. तिसरी पायरी\\nHTML नाही।",
  "prevention": "प्रतिबंध यादी:\\n1. पहिला उपाय\\n2. दुसरा उपाय",
  "severity": "low किंवा medium किंवा high",
  "followup_questions": ["प्रश्न 1?", "प्रश्न 2?"]
}}"""

    try:
        # Configure Gemini
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel('gemini-pro-vision')
        
        # Prepare image
        image_part = {
            "mime_type": mime_type,
            "data": image_bytes
        }
        
        # Call Gemini Vision API
        response = model.generate_content([prompt, image_part])
        
        raw = response.text.strip()
        logger.info(f"Gemini Vision response: {raw[:200]}...")
        
        # Clean and extract JSON
        raw = re.sub(r'```json\s*', '', raw)
        raw = re.sub(r'```\s*', '', raw)
        
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            
            # ✅ Enhanced text cleaning
            for key in ['diagnosis', 'treatment', 'prevention']:
                if key in data and isinstance(data[key], str):
                    # Remove HTML tags
                    data[key] = re.sub(r'<[^>]+>', '', data[key])
                    # Remove color references and other noise
                    data[key] = re.sub(r'\(In blue color\):?', '', data[key])
                    data[key] = re.sub(r'\(in.*?color\):?', '', data[key], flags=re.IGNORECASE)
                    # Fix spacing around numbers - ensure "1. Text" not "1.\n    Text"
                    data[key] = re.sub(r'(\d+\.)\s*\n\s*', r'\1 ', data[key])
                    # Clean excessive whitespace
                    data[key] = re.sub(r'\s+', ' ', data[key])
                    # Restore proper line breaks before numbered items
                    data[key] = re.sub(r'(\d+\.)', r'\n\1', data[key])
                    data[key] = data[key].strip()
            
            # Add follow-up questions to diagnosis
            if 'followup_questions' in data and data['followup_questions']:
                questions = data['followup_questions']
                if language == "english":
                    q_text = "\n\nTo provide more accurate diagnosis, please answer:\n"
                elif language == "hindi":
                    q_text = "\n\nअधिक सटीक निदान के लिए कृपया उत्तर दें:\n"
                else:
                    q_text = "\n\nअधिक अचूक निदानासाठी कृपया उत्तर द्या:\n"
                
                q_text += "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions[:3]))
                data['diagnosis'] += q_text
            
            # Add disclaimer
            disclaimers = {
                "english": "\n\n⚠️ Note: This is AI-assisted preliminary analysis. For critical decisions, consult a local agricultural expert.",
                "hindi": "\n\n⚠️ नोट: यह AI-सहायता प्राप्त प्रारंभिक विश्लेषण है। महत्वपूर्ण निर्णयों के लिए स्थानीय कृषि विशेषज्ञ से परामर्श करें।",
                "marathi": "\n\n⚠️ टीप: हे AI-सहाय्यित प्राथमिक विश्लेषण आहे. महत्त्वाच्या निर्णयांसाठी स्थानिक कृषी तज्ञांचा सल्ला घ्या."
            }
            data['treatment'] += disclaimers.get(language, disclaimers["english"])
            
            return data
        else:
            logger.error(f"Could not extract JSON: {raw}")
            return {
                "detected_issues": ["Analysis incomplete"],
                "diagnosis": "Could not parse image analysis. Please describe what you see in the chat.",
                "treatment": "Describe: leaf color, spots, holes, insects, wilting",
                "prevention": "Regular monitoring",
                "severity": "unknown",
                "followup_questions": []
            }
        
    except Exception as e:
        error_str = str(e)
        logger.error(f"Gemini Vision error: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        
        # ✅ Check if it's a quota error
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
            return {
                "detected_issues": ["Quota exceeded - using text analysis"],
                "diagnosis": "Daily API quota reached. Please describe what you see in the image: What type of plant? What color are the leaves? Any spots, holes, or damage? Any insects visible?",
                "treatment": "Once you describe the symptoms in text, I'll provide detailed treatment advice.",
                "prevention": "Image analysis will be available again tomorrow. For now, text descriptions work great!",
                "severity": "unknown",
                "followup_questions": [
                    "What plant species is this?",
                    "What symptoms do you see?",
                    "When did the problem start?"
                ]
            }
        else:
            return {
                "detected_issues": ["Vision analysis failed"],
                "diagnosis": f"Image analysis error: {error_str}. Please describe your plant problem in text.",
                "treatment": "Describe symptoms: yellowing, spots, wilting, pests",
                "prevention": "Regular plant inspection",
                "severity": "unknown",
                "followup_questions": []
            }