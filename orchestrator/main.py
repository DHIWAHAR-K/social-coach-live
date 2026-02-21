"""
Orchestrator: single entry point for the frontend. Coordinates YOLO, Emotion, ASR, LLM services.
Run from repo root: PYTHONPATH=. uvicorn orchestrator.main:app --port 8000
Or from this dir: PYTHONPATH=.. uvicorn main:app --port 8000
"""
import base64
import io
import logging
import os
import sys
import uuid
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
    FaceCrop,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Social Coach Orchestrator")

# CORS so frontend (e.g. http://localhost:8080) can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs from env (defaults to localhost)
YOLO_SERVICE_URL = os.getenv("YOLO_SERVICE_URL", "http://localhost:8001").rstrip("/")
EMOTION_SERVICE_URL = os.getenv("EMOTION_SERVICE_URL", "http://localhost:8002").rstrip("/")
ASR_SERVICE_URL = os.getenv("ASR_SERVICE_URL", "http://localhost:8003").rstrip("/")
LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://localhost:8004").rstrip("/")

# Timeout for media pipeline (ASR/LLM can be slow)
SERVICE_TIMEOUT = 120.0


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
                f"{LLM_SERVICE_URL}/explain-turn",
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


# --- Helpers for /analyze-media ---
def _crop_face_from_frame(frame: Frame, face: DetectedFace) -> FaceCrop:
    """Decode frame image, crop bbox, return FaceCrop with base64 crop."""
    from PIL import Image
    raw = base64.b64decode(frame.image_base64)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    x, y, w, h = [int(round(v)) for v in face.bbox]
    x = max(0, min(x, img.width - 1))
    y = max(0, min(y, img.height - 1))
    w = max(1, min(w, img.width - x))
    h = max(1, min(h, img.height - y))
    crop = img.crop((x, y, x + w, y + h))
    buf = io.BytesIO()
    crop.save(buf, format="JPEG", quality=85)
    crop_b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return FaceCrop(face_id=face.face_id, timestamp=face.timestamp, image_base64=crop_b64)


def _dominant_emotion_for_segment(
    segment: ASRSegment,
    emotion_results: list[EmotionResult],
    time_window: float = 2.0,
) -> str | None:
    """Find dominant emotion in [segment.start - window, segment.end + window]. Returns emotion string or None."""
    low, high = segment.start - time_window, segment.end + time_window
    in_window = [e for e in emotion_results if low <= e.timestamp <= high]
    if not in_window:
        return None
    # Pick highest-confidence emotion in window
    best = max(in_window, key=lambda e: e.confidence)
    return best.emotion


# --- POST /analyze-media (full pipeline) ---
class MediaRequest(BaseModel):
    frames: list[Frame] = []
    audio_chunks: list[AudioChunk] = []


class MediaAnalysisResponse(BaseModel):
    turns: list[TurnForLLM]
    explanations: list[LLMExplanation]


@app.post("/analyze-media", response_model=MediaAnalysisResponse)
def analyze_media(req: MediaRequest) -> MediaAnalysisResponse:
    """
    1. YOLO: frames -> DetectedFace[]
    2. Build face crops, Emotion: -> EmotionResult[]
    3. ASR: audio_chunks -> ASRSegment[]
    4. Fuse segments + emotions -> TurnForLLM[]
    5. LLM per turn -> LLMExplanation[]
    """
    frames_by_id = {f.frame_id: f for f in req.frames}
    turns: list[TurnForLLM] = []
    explanations: list[LLMExplanation] = []

    with httpx.Client(timeout=SERVICE_TIMEOUT) as client:
        # 1. Face detection
        detected_faces: list[DetectedFace] = []
        if req.frames:
            logger.info("Calling YOLO service at %s/detect-faces", YOLO_SERVICE_URL)
            try:
                r = client.post(
                    f"{YOLO_SERVICE_URL}/detect-faces",
                    json=[f.model_dump() for f in req.frames],
                )
                r.raise_for_status()
                detected_faces = [DetectedFace.model_validate(o) for o in r.json()]
                logger.info("YOLO returned %d face(s)", len(detected_faces))
            except (httpx.HTTPStatusError, httpx.ConnectError, httpx.TimeoutException) as e:
                logger.exception("YOLO service failed: %s", e)
                raise HTTPException(status_code=502, detail="YOLO service unavailable") from e

        # 2. Emotion classification (face crops)
        emotion_results: list[EmotionResult] = []
        if detected_faces:
            face_crops: list[FaceCrop] = []
            for face in detected_faces:
                frame = frames_by_id.get(face.frame_id)
                if frame is None:
                    continue
                try:
                    face_crops.append(_crop_face_from_frame(frame, face))
                except Exception as e:
                    logger.warning("Skip crop for face %s: %s", face.face_id, e)
            if face_crops:
                logger.info("Calling Emotion service at %s/classify-emotions", EMOTION_SERVICE_URL)
                try:
                    r = client.post(
                        f"{EMOTION_SERVICE_URL}/classify-emotions",
                        json=[c.model_dump() for c in face_crops],
                    )
                    r.raise_for_status()
                    emotion_results = [EmotionResult.model_validate(o) for o in r.json()]
                except (httpx.HTTPStatusError, httpx.ConnectError, httpx.TimeoutException) as e:
                    logger.exception("Emotion service failed: %s", e)
                    raise HTTPException(status_code=502, detail="Emotion service unavailable") from e

        # 3. ASR
        asr_segments: list[ASRSegment] = []
        if req.audio_chunks:
            logger.info("Calling ASR service at %s/transcribe", ASR_SERVICE_URL)
            try:
                r = client.post(
                    f"{ASR_SERVICE_URL}/transcribe",
                    json=[c.model_dump() for c in req.audio_chunks],
                )
                r.raise_for_status()
                asr_segments = [ASRSegment.model_validate(o) for o in r.json()]
                logger.info("ASR returned %d segment(s)", len(asr_segments))
            except (httpx.HTTPStatusError, httpx.ConnectError, httpx.TimeoutException) as e:
                logger.exception("ASR service failed: %s", e)
                raise HTTPException(status_code=502, detail="ASR service unavailable") from e

        # 4. Fuse into TurnForLLM (one main speaker for v1)
        for seg in asr_segments:
            facial = _dominant_emotion_for_segment(seg, emotion_results)
            turn_id = str(uuid.uuid4())
            turn = TurnForLLM(
                turn_id=turn_id,
                speaker_id=seg.speaker_id,
                speaker_name="Person B",
                text=seg.text,
                facial_emotion=facial,
                vocal_emotion=None,
                start=seg.start,
                end=seg.end,
            )
            turns.append(turn)

        # 5. LLM per turn
        for turn in turns:
            logger.info("Calling LLM service for turn %s", turn.turn_id)
            try:
                r = client.post(
                    f"{LLM_SERVICE_URL}/explain-turn",
                    json=turn.model_dump(),
                )
                r.raise_for_status()
                explanations.append(LLMExplanation.model_validate(r.json()))
            except (httpx.HTTPStatusError, httpx.ConnectError, httpx.TimeoutException) as e:
                logger.exception("LLM service failed for turn %s: %s", turn.turn_id, e)
                raise HTTPException(status_code=502, detail="LLM service unavailable") from e

    return MediaAnalysisResponse(turns=turns, explanations=explanations)
