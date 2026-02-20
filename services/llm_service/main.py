"""
LLM social-coach explanation service.
Uses OpenAI by default (set OPENAI_API_KEY). For Anthropic, set ANTHROPIC_API_KEY and use provider=anthropic.
Run from repo root: PYTHONPATH=. uvicorn services.llm_service.main:app --port 8004
Or from this dir: PYTHONPATH=../.. uvicorn main:app --port 8004
"""
import os
import sys
import json
import logging
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from fastapi import FastAPI, HTTPException
from shared_models import TurnForLLM, LLMExplanation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LLM Social Coach Service")

# Provider: "openai" or "anthropic". Default openai if OPENAI_API_KEY set, else anthropic if ANTHROPIC_API_KEY set.
def _get_client():
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if openai_key:
        try:
            from openai import OpenAI
            return ("openai", OpenAI(api_key=openai_key))
        except ImportError:
            logger.warning("OPENAI_API_KEY set but openai not installed; pip install openai")
    if anthropic_key:
        try:
            from anthropic import Anthropic
            return ("anthropic", Anthropic(api_key=anthropic_key))
        except ImportError:
            logger.warning("ANTHROPIC_API_KEY set but anthropic not installed; pip install anthropic")
    return (None, None)


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
    provider, client = _get_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY and install openai or anthropic.",
        )

    user_content = f"Speaker: {turn.speaker_name} (id={turn.speaker_id})\nText: {turn.text}"
    if turn.facial_emotion:
        user_content += f"\nFacial emotion hint: {turn.facial_emotion}"
    if turn.vocal_emotion:
        user_content += f"\nVocal emotion hint: {turn.vocal_emotion}"

    try:
        if provider == "openai":
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                temperature=0.3,
            )
            raw = resp.choices[0].message.content.strip()
        else:
            model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")
            resp = client.messages.create(
                model=model,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_content}],
            )
            raw = resp.content[0].text.strip()
    except Exception as e:
        logger.exception("LLM API call failed")
        raise HTTPException(status_code=502, detail=f"LLM provider error: {e!s}") from e

    # Parse JSON (allow markdown code block wrapper)
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    data = json.loads(raw)
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
