"""
Minimal script to test POST /analyze-media.
Run from repo root with orchestrator + YOLO + Emotion + ASR + LLM services up:
  python scripts/test_analyze_media.py

Optional: pass path to a WAV file to use real audio; otherwise uses empty/minimal payload.
"""
import base64
import os
import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(repo_root))

import httpx

ORCHESTRATOR_URL = os.getenv("ORCHESTRATOR_URL", "http://localhost:8000")


def main():
    wav_path = sys.argv[1] if len(sys.argv) > 1 else None
    audio_chunks = []
    if wav_path and Path(wav_path).exists():
        with open(wav_path, "rb") as f:
            audio_chunks = [
                {
                    "chunk_id": "chunk-0",
                    "timestamp_start": 0.0,
                    "timestamp_end": 10.0,
                    "audio_base64": base64.b64encode(f.read()).decode("ascii"),
                }
            ]
    payload = {"frames": [], "audio_chunks": audio_chunks}
    print("POST %s/analyze-media ..." % ORCHESTRATOR_URL)
    try:
        r = httpx.post(
            f"{ORCHESTRATOR_URL}/analyze-media",
            json=payload,
            timeout=120.0,
        )
        r.raise_for_status()
        data = r.json()
        turns = data.get("turns", [])
        explanations = data.get("explanations", [])
        print("turns:", len(turns))
        print("explanations:", len(explanations))
        for i, exp in enumerate(explanations):
            print("\n--- Explanation %d ---" % (i + 1))
            print("  intent_summary:", exp.get("intent_summary", "")[:200])
            print("  suggested_reply:", exp.get("suggested_reply", "")[:200])
    except Exception as e:
        print("Error:", e)
        raise


if __name__ == "__main__":
    main()
