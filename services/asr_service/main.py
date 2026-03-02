"""
ASR + diarization service (Whisper / faster-whisper + Diart).
Concatenates audio chunks, transcribes with faster-whisper, optionally runs real-time
speaker diarization via Diart when DIARIZATION_ENABLED=true.
Run from repo root: PYTHONPATH=. uvicorn services.asr_service.main:app --port 8003
"""
import base64
import io
import logging
import sys
import tempfile
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import numpy as np
from fastapi import FastAPI, HTTPException
from shared_models import AudioChunk, ASRSegment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ASR Service")

# Lazy-load model so startup stays fast; reuse for subsequent requests
_model = None


def _get_model():
    global _model
    if _model is None:
        try:
            from faster_whisper import WhisperModel
            # base, small, medium, large-v2, large-v3; "base" is fast and decent
            model_size = __import__("os").environ.get("WHISPER_MODEL_SIZE", "base")
            _model = WhisperModel(model_size, device="cpu", compute_type="int8")
            logger.info("Loaded Whisper model %s", model_size)
        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="faster_whisper not installed. pip install faster-whisper",
            )
    return _model


def _decode_audio_chunks(chunks: list[AudioChunk]) -> tuple[np.ndarray, float, float]:
    """Decode base64 chunks into one float32 mono array and global start/end time.
    Assumes each chunk's audio_base64 is raw PCM s16le at 16kHz (or WAV bytes).
    """
    import wave
    all_arrays = []
    rate = 16000
    t_start = min(c.timestamp_start for c in chunks) if chunks else 0.0
    t_end = max(c.timestamp_end for c in chunks) if chunks else 0.0

    for c in chunks:
        raw = base64.b64decode(c.audio_base64)
        # If it looks like WAV (RIFF header), parse it
        if raw[:4] == b"RIFF":
            with io.BytesIO(raw) as bio:
                with wave.open(bio, "rb") as wav:
                    rate = wav.getframerate()
                    n = wav.getnframes()
                    if n == 0:
                        continue
                    buf = wav.readframes(n)
                    if wav.getsampwidth() == 2:
                        arr = np.frombuffer(buf, dtype=np.int16).astype(np.float32) / 32768.0
                    else:
                        arr = np.frombuffer(buf, dtype=np.float32)
                    if wav.getnchannels() == 2:
                        arr = arr.reshape(-1, 2).mean(axis=1)
                    all_arrays.append(arr)
        else:
            # Assume raw s16le mono at 16kHz
            arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
            all_arrays.append(arr)

    if not all_arrays:
        return np.array([], dtype=np.float32), t_start, t_end
    concat = np.concatenate(all_arrays)
    return concat, t_start, t_end


@app.post("/transcribe", response_model=list[ASRSegment])
def transcribe(chunks: list[AudioChunk]) -> list[ASRSegment]:
    logger.info("Received %d audio chunk(s) for transcription", len(chunks))
    if not chunks:
        return []

    try:
        audio, t_start, t_end = _decode_audio_chunks(chunks)
    except Exception as e:
        logger.exception("Failed to decode audio: %s", e)
        raise HTTPException(status_code=400, detail=f"Invalid audio data: {e}") from e

    if len(audio) == 0:
        return []

    # Run Whisper (to temp file for faster_whisper which prefers file path)
    model = _get_model()
    wav_path = None
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        import wave
        with wave.open(f.name, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(16000)
            wav.writeframes((audio * 32767).astype(np.int16).tobytes())
        wav_path = f.name

    try:
        segments_iter, info = model.transcribe(wav_path, language=None, word_timestamps=False)
        segments_list = list(segments_iter)

        # Run diarization on same wav file (when DIARIZATION_ENABLED=true)
        diar_segments: list = []
        try:
            from .diarization import run_diarization
            diar_segments = run_diarization(wav_path, sample_rate=16000)
            if diar_segments:
                logger.info("Diarization found %d speaker segment(s)", len(diar_segments))
        except Exception as e:
            logger.warning("Diarization skipped: %s", e)

        def _assign_speaker(seg_start: float, seg_end: float) -> str:
            if not diar_segments:
                return "speaker_1"
            best_speaker, best_overlap = "speaker_1", 0.0
            for d_start, d_end, speaker in diar_segments:
                o_start, o_end = max(seg_start, d_start), min(seg_end, d_end)
                if o_end > o_start and (o_end - o_start) > best_overlap:
                    best_overlap = o_end - o_start
                    best_speaker = speaker
            return best_speaker

        # Build ASRSegment list; assign speaker from diarization or fallback to speaker_1
        out = []
        for seg in segments_list:
            text = (seg.text or "").strip()
            if not text:
                continue
            speaker_id = _assign_speaker(seg.start, seg.end)
            out.append(
                ASRSegment(
                    segment_id=str(uuid.uuid4()),
                    speaker_id=speaker_id,
                    text=text,
                    start=seg.start,
                    end=seg.end,
                )
            )
    finally:
        Path(wav_path).unlink(missing_ok=True)

    if not out:
        out = [
            ASRSegment(
                segment_id=str(uuid.uuid4()),
                speaker_id="speaker_1",
                text="(no speech detected)",
                start=t_start,
                end=t_end,
            )
        ]
    return out
