"""
YOLO face detection service (stub).
Run from repo root: PYTHONPATH=. uvicorn services.yolo_service.main:app --port 8001
Or from this dir: PYTHONPATH=../.. uvicorn main:app --port 8001
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import logging
from fastapi import FastAPI
from shared_models import Frame, DetectedFace

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YOLO Face Detection Service")


@app.post("/detect-faces", response_model=list[DetectedFace])
def detect_faces(frames: list[Frame]) -> list[DetectedFace]:
    logger.info("Received %d frame(s) for face detection", len(frames))
    # TODO: run YOLO model here; load model once at startup for production
    results = []
    for i, frame in enumerate(frames):
        results.append(
            DetectedFace(
                face_id=f"face-{frame.frame_id}-0",
                bbox=[0.0, 0.0, 100.0, 100.0],
                confidence=0.95,
                timestamp=frame.timestamp,
            )
        )
    return results
