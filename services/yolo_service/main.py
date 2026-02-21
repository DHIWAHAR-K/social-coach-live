"""
YOLO face detection service.
Uses OpenCV CascadeClassifier (built-in) for v1; TODO: swap to Ultralytics YOLOv8 face model.
Per-frame detection only; no tracking across frames.
Run from repo root: PYTHONPATH=. uvicorn services.yolo_service.main:app --port 8001
"""
import base64
import logging
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from shared_models import Frame, DetectedFace

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YOLO Face Detection Service")

# Confidence threshold for detections
CONFIDENCE_THRESHOLD = float(__import__("os").environ.get("FACE_CONFIDENCE_THRESHOLD", "0.5"))

# Lazy-load OpenCV face detector (Haar cascade, no download)
_detector = None


def _get_detector():
    global _detector
    if _detector is None:
        path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _detector = cv2.CascadeClassifier(path)
        if _detector.empty():
            raise HTTPException(status_code=503, detail="OpenCV face cascade failed to load")
        logger.info("Loaded OpenCV face detector")
    return _detector


def _decode_image(image_base64: str) -> np.ndarray:
    """Decode base64 JPEG/PNG to BGR numpy array."""
    raw = base64.b64decode(image_base64)
    buf = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img


@app.post("/detect-faces", response_model=list[DetectedFace])
def detect_faces(frames: list[Frame]) -> list[DetectedFace]:
    logger.info("Received %d frame(s) for face detection", len(frames))
    detector = _get_detector()
    results = []
    for frame in frames:
        try:
            img = _decode_image(frame.image_base64)
        except Exception as e:
            logger.warning("Skip frame %s: decode failed: %s", frame.frame_id, e)
            continue
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # scaleFactor, minNeighbors; minSize optional
        boxes = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        for (x, y, w, h) in boxes:
            # OpenCV cascade does not return confidence; use fixed value for v1
            confidence = 0.9
            if confidence < CONFIDENCE_THRESHOLD:
                continue
            results.append(
                DetectedFace(
                    face_id=str(uuid.uuid4()),
                    frame_id=frame.frame_id,
                    bbox=[float(x), float(y), float(w), float(h)],
                    confidence=confidence,
                    timestamp=frame.timestamp,
                )
            )
    return results
