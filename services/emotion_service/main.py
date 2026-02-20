"""
Emotion recognition service (stub).
Run from repo root: PYTHONPATH=. uvicorn services.emotion_service.main:app --port 8002
Or from this dir: PYTHONPATH=../.. uvicorn main:app --port 8002
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import logging
from fastapi import FastAPI
from shared_models import FaceWithCrop, EmotionResult

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Emotion Recognition Service")


@app.post("/classify-emotions", response_model=list[EmotionResult])
def classify_emotions(faces: list[FaceWithCrop]) -> list[EmotionResult]:
    logger.info("Received %d face(s) for emotion classification", len(faces))
    # TODO: run FER model here; load model once at startup for production
    results = []
    for face in faces:
        results.append(
            EmotionResult(
                face_id=face.face_id,
                emotion="neutral",
                confidence=0.8,
                timestamp=face.timestamp,
            )
        )
    return results
