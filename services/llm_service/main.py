"""
LLM social-coach explanation service (local via Ollama).
Set OLLAMA_BASE_URL (default http://localhost:11434) and OLLAMA_MODEL (e.g. llama3.2:70b).
Run from repo root: uvicorn services.llm_service.main:app --port 8004
Or from this dir: PYTHONPATH=../.. uvicorn main:app --port 8004
"""
import os
import sys
import json
import logging
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import httpx
from fastapi import FastAPI, HTTPException
from shared_models import TurnForLLM, LLMExplanation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LLM Social Coach Service")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:70b")


SYSTEM_PROMPT = """You are a social communication coach for neurodivergent users (especially autistic users).
You receive a single conversational turn with:
- speaker name and ID
- transcript text
- optional facial and vocal emotion hints
Explain:
1) what they likely mean (intent),
2) how they might be feeling,
3) how the autistic user might interpret this,
4) a short, concrete suggested reply.
Respond as pure JSON only, with exactly these keys: intent_summary, emotional_state, suggested_interpretation, suggested_reply.
No markdown, no code block wrapper."""


def _call_llm(turn: TurnForLLM) -> LLMExplanation:
    user_content = f"Speaker: {turn.speaker_name} (id={turn.speaker_id})\nText: {turn.text}"
    if turn.facial_emotion:
        user_content += f"\nFacial emotion hint: {turn.facial_emotion}"
    if turn.vocal_emotion:
        user_content += f"\nVocal emotion hint: {turn.vocal_emotion}"

    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "options": {"temperature": 0.3, "num_predict": 1024},
    }

    logger.info("Calling Ollama at %s with model %s", OLLAMA_BASE_URL, OLLAMA_MODEL)
    try:
        with httpx.Client(timeout=120.0) as client:
            r = client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            r.raise_for_status()
            out = r.json()
    except httpx.ConnectError as e:
        logger.error("Ollama not reachable at %s: %s", OLLAMA_BASE_URL, e)
        raise HTTPException(
            status_code=503,
            detail="Ollama not reachable. Start Ollama (e.g. ollama serve) and ensure the model is pulled.",
        ) from e
    except httpx.HTTPStatusError as e:
        logger.exception("Ollama returned %s: %s", e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail="Ollama request failed") from e
    except httpx.TimeoutException as e:
        logger.exception("Ollama request timed out: %s", e)
        raise HTTPException(status_code=504, detail="Ollama request timed out") from e

    content = out.get("message", {}).get("content")
    if not content:
        raise HTTPException(status_code=502, detail="Ollama returned no content")
    raw = content.strip()

    # Parse JSON (allow markdown code block wrapper)
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.exception("Ollama response was not valid JSON: %s", raw[:200])
        raise HTTPException(status_code=502, detail="Ollama response was not valid JSON") from e

    for key in ("intent_summary", "emotional_state", "suggested_interpretation", "suggested_reply"):
        if key not in data:
            data[key] = ""

    return LLMExplanation(
        id=str(uuid.uuid4()),
        turn_id=turn.turn_id,
        speaker_id=turn.speaker_id,
        intent_summary=data["intent_summary"],
        emotional_state=data["emotional_state"],
        suggested_interpretation=data["suggested_interpretation"],
        suggested_reply=data["suggested_reply"],
    )


@app.post("/explain-turn", response_model=LLMExplanation)
def explain_turn(turn: TurnForLLM) -> LLMExplanation:
    logger.info("Explaining turn %s for speaker %s", turn.turn_id, turn.speaker_id)
    return _call_llm(turn)
