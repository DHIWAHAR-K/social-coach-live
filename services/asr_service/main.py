"""
ASR + diarization service (Whisper stub).
Run from repo root: PYTHONPATH=. uvicorn services.asr_service.main:app --port 8003
Or from this dir: PYTHONPATH=../.. uvicorn main:app --port 8003
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import logging
from fastapi import FastAPI
from shared_models import AudioChunk, ASRSegment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ASR Service")


@app.post("/transcribe", response_model=list[ASRSegment])
def transcribe(chunks: list[AudioChunk]) -> list[ASRSegment]:
    logger.info("Received %d audio chunk(s) for transcription", len(chunks))
    # TODO: Whisper + diarization; decode base64, run pipeline, return segments
    segments = []
    for i, chunk in enumerate(chunks):
        segments.append(
            ASRSegment(
                segment_id=f"seg-{chunk.chunk_id}-{i}",
                speaker_id="spk-0",
                text="[Placeholder transcript]",
                start=chunk.timestamp_start,
                end=chunk.timestamp_end,
            )
        )
    return segments
