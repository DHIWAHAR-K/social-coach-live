"""
Orchestrator: single entry point for the frontend. Coordinates YOLO, Emotion, ASR, LLM services.
Run from repo root: PYTHONPATH=. uvicorn orchestrator.main:app --port 8000
Or from this dir: PYTHONPATH=.. uvicorn main:app --port 8000
"""
import os
import sys
import logging
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from shared_models import (
    TurnForLLM,
    LLMExplanation,
    Frame,
    AudioChunk,
    DetectedFace,
    EmotionResult,
    ASRSegment,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Social Coach Orchestrator")

# CORS so frontend (e.g. http://localhost:8080) can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:8080").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs from env (defaults to localhost)
YOLO_SERVICE_URL = os.getenv("YOLO_SERVICE_URL", "http://localhost:8001")
EMOTION_SERVICE_URL = os.getenv("EMOTION_SERVICE_URL", "http://localhost:8002")
ASR_SERVICE_URL = os.getenv("ASR_SERVICE_URL", "http://localhost:8003")
LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://localhost:8004")


class ChatMessage(BaseModel):
    id: str
    speaker_id: str
    speaker_name: str
    text: str
    timestamp: float


# --- POST /analyze-message (implemented) ---
@app.post("/analyze-message", response_model=LLMExplanation)
def analyze_message(msg: ChatMessage) -> LLMExplanation:
    """Build TurnForLLM from chat message, call LLM service, return explanation."""
    turn = TurnForLLM(
        turn_id=msg.id,
        speaker_id=msg.speaker_id,
        speaker_name=msg.speaker_name,
        text=msg.text,
        facial_emotion=None,
        vocal_emotion=None,
        start=msg.timestamp,
        end=msg.timestamp,
    )
    logger.info("Calling LLM service at %s/explain-turn", LLM_SERVICE_URL)
    try:
        with httpx.Client(timeout=60.0) as client:
            r = client.post(
                f"{LLM_SERVICE_URL.rstrip('/')}/explain-turn",
                json=turn.model_dump(),
            )
            r.raise_for_status()
            return LLMExplanation.model_validate(r.json())
    except httpx.HTTPStatusError as e:
        logger.error("LLM service returned %s: %s", e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail="LLM service unavailable") from e
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        logger.error("LLM service request failed: %s", e)
        raise HTTPException(status_code=502, detail="LLM service unavailable") from e


# --- POST /analyze-media (stub) ---
# Future flow:
# 1. Send frames to YOLO service -> DetectedFace[]
# 2. Send detected faces + crops to Emotion service -> EmotionResult[]
# 3. Send audio chunks to ASR service -> ASRSegment[]
# 4. Fuse segments + emotions into TurnForLLM[]
# 5. For each turn, call LLM service -> LLMExplanation[]
class AnalyzeMediaRequest(BaseModel):
    frames: list[Frame] = []
    audio_chunks: list[AudioChunk] = []


@app.post("/analyze-media")
def analyze_media(body: AnalyzeMediaRequest):
    """Stub: future endpoint for frames + audio. Returns placeholder."""
    # TODO: implement pipeline: YOLO -> Emotion -> ASR -> fuse -> LLM per turn
    return {"explanations": [], "message": "Not implemented"}

