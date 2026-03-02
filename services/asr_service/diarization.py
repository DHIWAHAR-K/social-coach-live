"""
Real-time speaker diarization via Diart.
Optional: set DIARIZATION_ENABLED=true and HF_TOKEN for HuggingFace pyannote models.
"""
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

DIARIZATION_ENABLED = os.getenv("DIARIZATION_ENABLED", "false").lower() in ("true", "1", "yes")
HF_TOKEN = os.getenv("HF_TOKEN", "")  # or use huggingface-cli login

# List of (start, end, speaker_id) for a chunk
DiarSegment = tuple[float, float, str]


def _get_diarization_pipeline():
    """Lazy-load Diart SpeakerDiarization pipeline."""
    try:
        from diart import SpeakerDiarization, SpeakerDiarizationConfig
        from diart.sources import FileAudioSource
        from diart.inference import StreamingInference

        # Use smaller latency for chunk-based processing (our chunks are ~4s)
        config_kw = dict(
            step=0.5,
            latency=0.5,
            tau_active=0.555,
            rho_update=0.422,
            delta_new=1.517,
        )
        if HF_TOKEN:
            config_kw["hf_token"] = HF_TOKEN
        config = SpeakerDiarizationConfig(**config_kw)
        pipeline = SpeakerDiarization(config)
        return pipeline, FileAudioSource, StreamingInference
    except ImportError as e:
        logger.warning("Diart not available: %s", e)
        return None, None, None


_pipeline_cache = None


def run_diarization(wav_path: str | Path, sample_rate: int = 16000) -> list[DiarSegment]:
    """
    Run speaker diarization on a WAV file.
    Returns list of (start, end, speaker_id) e.g. (0.5, 2.3, "SPEAKER_00").
    """
    global _pipeline_cache
    if not DIARIZATION_ENABLED:
        return []

    pipeline, FileAudioSource, StreamingInference = _get_diarization_pipeline()
    if pipeline is None or FileAudioSource is None or StreamingInference is None:
        return []

    try:
        source = FileAudioSource(str(wav_path), sample_rate=sample_rate)
        inference = StreamingInference(
            pipeline,
            source,
            do_profile=False,
            do_plot=False,
            show_progress=False,
        )
        prediction = inference()
        source.close()
    except Exception as e:
        logger.warning("Diarization failed: %s", e)
        return []

    segments: list[DiarSegment] = []
    try:
        for segment, _, speaker in prediction.itertracks(yield_label=True):
            segments.append((segment.start, segment.end, speaker))
    except Exception as e:
        logger.warning("Failed to iterate diarization result: %s", e)
        return []

    return segments


def assign_speaker_to_whisper_segment(
    seg_start: float,
    seg_end: float,
    diar_segments: list[DiarSegment],
) -> str:
    """
    For a Whisper segment (seg_start, seg_end), find the dominant speaker
    from diarization segments by maximum overlap. Returns speaker_id or "speaker_1" as fallback.
    """
    if not diar_segments:
        return "speaker_1"

    best_speaker = "speaker_1"
    best_overlap = 0.0

    for d_start, d_end, speaker in diar_segments:
        overlap_start = max(seg_start, d_start)
        overlap_end = min(seg_end, d_end)
        if overlap_end > overlap_start:
            overlap = overlap_end - overlap_start
            if overlap > best_overlap:
                best_overlap = overlap
                best_speaker = speaker

    return best_speaker
