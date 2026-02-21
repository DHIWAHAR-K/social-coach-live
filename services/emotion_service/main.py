"""
Emotion recognition service (FER on face crops).
Accepts List[FaceCrop]; v1 uses deterministic mock (neutral 0.7).
TODO: swap in real FER model (e.g. deepface, fer, or small CNN).
Run from repo root: PYTHONPATH=. uvicorn services.emotion_service.main:app --port 8002
"""
import base64
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from fastapi import FastAPI
from shared_models import FaceCrop, EmotionResult

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Emotion Recognition Service")

EMOTIONS = ["neutral", "happy", "sad", "angry", "fearful", "surprised", "disgusted"]


def _classify_one(face: FaceCrop) -> EmotionResult:
    """
    Classify emotion for one face crop.
    v1: deterministic mock (always neutral, 0.7).
    TODO: run real FER model here (e.g. DeepFace.analyze, or loaded CNN).
    """
    return EmotionResult(
        face_id=face.face_id,
        emotion="neutral",
        confidence=0.7,
        timestamp=face.timestamp,
    )


@app.post("/classify-emotions", response_model=list[EmotionResult])
def classify_emotions(faces: list[FaceCrop]) -> list[EmotionResult]:
    logger.info("Received %d face crop(s) for emotion classification", len(faces))
    return [_classify_one(f) for f in faces]
