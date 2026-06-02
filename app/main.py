from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import chat, voice, image, tts  

app = FastAPI(
    title="AgriBot - Agriculture AI Chatbot",
    description="AI-powered agriculture assistant",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://agribot-seven.vercel.app/",  # your Vercel URL
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
os.makedirs("uploads/images", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
app.include_router(image.router, prefix="/api/image", tags=["Image Analysis"])
app.include_router(tts.router, prefix="/api/tts", tags=["TTS"])

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