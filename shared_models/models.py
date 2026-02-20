"""Pydantic models shared by orchestrator and all ML services."""
from pydantic import BaseModel
from typing import List, Optional


class Frame(BaseModel):
    frame_id: str
    timestamp: float  # seconds
    image_base64: str  # JPEG/PNG base64 for now


class AudioChunk(BaseModel):
    chunk_id: str
    timestamp_start: float
    timestamp_end: float
    audio_base64: str  # e.g. mono PCM in base64


class DetectedFace(BaseModel):
    face_id: str
    bbox: List[float]  # [x, y, w, h]
    confidence: float
    timestamp: float


class EmotionResult(BaseModel):
    face_id: str
    emotion: str
    confidence: float
    timestamp: float


class ASRSegment(BaseModel):
    segment_id: str
    speaker_id: str
    text: str
    start: float
    end: float


class TurnForLLM(BaseModel):
    turn_id: str
    speaker_id: str
    speaker_name: str
    text: str
    facial_emotion: Optional[str] = None
    vocal_emotion: Optional[str] = None
    start: float
    end: float


class LLMExplanation(BaseModel):
    id: str
    turn_id: str
    speaker_id: str
    intent_summary: str
    emotional_state: str
    suggested_interpretation: str
    suggested_reply: str


# Extended model for emotion service: face metadata + crop for FER
class FaceWithCrop(BaseModel):
    face_id: str
    bbox: List[float]
    confidence: float
    timestamp: float
    image_base64: str  # crop or full frame for this face
