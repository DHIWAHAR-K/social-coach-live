# Social Coach Live

A real-time social communication assistant designed for autistic and neurodivergent users. During a live video call or meeting, the app listens to conversation turns, detects faces and facial emotions in video frames, transcribes speech via Whisper ASR, and then calls a local LLM (via Ollama) to generate coaching explanations — helping users understand what a conversation partner likely meant, how they might be feeling, and how to respond.

## How It Works

1. **Meeting UI** — User joins a meeting in the React frontend. The `CoachPanel` captures messages from the conversation.
2. **Orchestrator** (`POST /analyze-message`) — Each chat turn is sent to the orchestrator, which forwards it to the LLM service.
3. **LLM Service** — A local Ollama model receives the turn (with optional facial/vocal emotion hints) and returns a structured explanation: intent summary, emotional state, suggested interpretation, and a suggested reply.
4. **Media Pipeline** (in progress) — `POST /analyze-media` accepts video frames + audio chunks, runs the full pipeline: YOLO → Emotion → ASR → LLM fusion.
5. **Real-time face detection** — `WebSocket /ws/faces` streams frames to YOLO for live face detection overlays.

## Architecture

```
React Frontend :5173
  └── MeetingPage
        ├── CoachPanel  ──POST /analyze-message──► Orchestrator :8000
        │                                               ├──► LLM Service :8004  (Ollama)
        │                                               ├──► YOLO Service :8001 (face detection)
        │                                               ├──► Emotion Service :8002 (FER)
        │                                               └──► ASR Service :8003  (Whisper)
        ├── VideoGrid   ──WS /ws/faces──────────► Orchestrator :8000
        ├── CaptionsList
        └── ExplanationPanel
```

## Services

| Service | Port | Conda Env | Technology |
|---|---|---|---|
| Orchestrator | 8000 | — | FastAPI, httpx |
| YOLO Service | 8001 | `autism_1` | FastAPI, YOLOv8 |
| Emotion Service | 8002 | `autism_2` | FastAPI, FER / DeepFace |
| ASR Service | 8003 | `autism_3` | FastAPI, Whisper |
| LLM Service | 8004 | `autism_4` | FastAPI, Ollama (llama3.1:8b) |

Each backend service runs in its own conda environment.

## Features

- **LLM coaching** — explains conversational intent, emotional state, and provides a suggested reply
- **Face detection** — real-time YOLO-based face detection via WebSocket stream
- **Emotion recognition** — FER-based facial emotion classification per detected face crop
- **Speech transcription** — Whisper ASR with optional real-time speaker diarization (Diart) for audio segments
- **Multimodal fusion** — orchestrator fuses facial emotion + ASR transcript per turn before LLM call
- **Shared Pydantic models** — typed data contracts across all services via `shared_models/`
- **Neurodivergent-focused UI** — clear, low-distraction meeting interface with coach panel and captions

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- shadcn/ui + Tailwind CSS
- TanStack Query
- WebSocket (real-time face detection)

**Backend**
- FastAPI + Uvicorn (all services)
- httpx (service-to-service calls)
- Pydantic v2 (shared data models)
- Ollama — local LLM (default: `llama3.1:8b-instruct-q5_k_m`)
- YOLOv8 — face detection
- FER / DeepFace — emotion classification
- OpenAI Whisper — ASR + diarization

## Project Structure

```
social-coach-live/
├── orchestrator/
│   ├── main.py          # FastAPI orchestrator (port 8000)
│   └── requirements.txt
├── services/
│   ├── yolo_service/    # Face detection (port 8001)
│   ├── emotion_service/ # FER emotion classification (port 8002)
│   ├── asr_service/     # Whisper transcription (port 8003)
│   └── llm_service/     # Ollama LLM coaching (port 8004)
├── shared_models/       # Pydantic models shared across services
├── src/
│   ├── components/
│   │   └── meeting/     # CoachPanel, VideoGrid, CaptionsList,
│   │                    # ExplanationPanel, ParticipantTile, etc.
│   ├── hooks/           # useRealtimeFaces, custom React hooks
│   ├── pages/
│   │   └── MeetingPage.tsx
│   └── types/           # TypeScript types
├── scripts/             # Helper scripts
└── package.json         # Frontend dependencies
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- [Conda](https://docs.conda.io/en/latest/miniconda.html)
- [Ollama](https://ollama.ai) installed and running
- Ollama model pulled: `ollama pull llama3.1:8b-instruct-q5_k_m`

### 1. Frontend

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

### 2. LLM Service (required for coaching)

```bash
conda activate autism_4
cd services/llm_service
uvicorn main:app --port 8004
```

### 3. Orchestrator

```bash
# From repo root:
PYTHONPATH=. uvicorn orchestrator.main:app --port 8000
```

### 4. Optional media services

```bash
# Face detection
conda activate autism_1 && PYTHONPATH=. uvicorn services.yolo_service.main:app --port 8001

# Emotion
conda activate autism_2 && PYTHONPATH=. uvicorn services.emotion_service.main:app --port 8002

# ASR
conda activate autism_3 && PYTHONPATH=. uvicorn services.asr_service.main:app --port 8003
```

## API Endpoints

**Orchestrator (port 8000)**
- `POST /analyze-message` — analyze a single chat turn via LLM
- `POST /analyze-media` — full media pipeline (frames + audio → explanations)
- `WS /ws/faces` — real-time face detection WebSocket

**LLM Service (port 8004)**
- `POST /explain-turn` — explain a conversation turn with Ollama

**YOLO Service (port 8001)**
- `POST /detect-faces` — detect faces in a list of base64 frames

**Emotion Service (port 8002)**
- `POST /classify-emotions` — classify emotion per face crop

**ASR Service (port 8003)**
- `POST /transcribe` — transcribe audio chunks with Whisper; optionally run speaker diarization when `DIARIZATION_ENABLED=true`

## Real-time Speaker Diarization (optional)

To enable real-time speaker diarization (separate "you" vs conversation partner):

1. Install diart and pyannote (included in ASR service requirements)
2. Accept user conditions for [pyannote/segmentation](https://huggingface.co/pyannote/segmentation) and [pyannote/embedding](https://huggingface.co/pyannote/embedding) on Hugging Face
3. Log in: `huggingface-cli login` or set `HF_TOKEN`
4. Set `DIARIZATION_ENABLED=true` when starting the ASR service

```bash
DIARIZATION_ENABLED=true HF_TOKEN=your_token conda activate autism_3 && PYTHONPATH=. uvicorn services.asr_service.main:app --port 8003
```

When disabled or if diart is unavailable, all segments use a single speaker ID.

## LLM System Prompt

The LLM service is specifically prompted to act as a social communication coach for neurodivergent users. Given a conversation turn it explains:
1. What the speaker likely meant (intent)
2. How they might be feeling
3. How the autistic user might interpret this
4. A short, concrete suggested reply

Output is structured JSON with keys: `intent_summary`, `emotional_state`, `suggested_interpretation`, `suggested_reply`.

## License

MIT
