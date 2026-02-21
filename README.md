# Welcome to your Lovable project

## Architecture

The app is an autism social communication assistant with a React frontend and a multi-service FastAPI backend. The frontend talks only to the **orchestrator**; the orchestrator coordinates YOLO (face detection), emotion recognition, ASR (Whisper/diarization), and LLM services.

```mermaid
flowchart LR
  subgraph frontend [React Frontend :8080]
    MeetingPage
    ExplanationPanel
    CoachPanel
  end
  subgraph backend [Backend]
    Orch[Orchestrator :8000]
    YOLO[YOLO Service :8001]
    Emotion[Emotion Service :8002]
    ASR[ASR Service :8003]
    LLM[LLM Service :8004]
  end
  MeetingPage -->|POST /analyze-message| Orch
  CoachPanel -->|chat message| MeetingPage
  Orch -->|POST /explain-turn| LLM
  Orch -.->|future: frames| YOLO
  Orch -.->|future: faces| Emotion
  Orch -.->|future: audio| ASR
```

- **Orchestrator** (port 8000): Single entry point for the frontend; implements `POST /analyze-message` (chat → LLM) and a stubbed `POST /analyze-media` for future video/audio.
- **YOLO / Emotion / ASR / LLM** (ports 8001–8004): Separate FastAPI services, each runnable in its own conda environment. Dotted lines indicate planned media pipeline (frames → faces → emotions; audio → transcripts; fusion → LLM).

  Conda environments (one per service):

  - **autism_1** — YOLO (face detection), port 8001
  - **autism_2** — Emotion (FER), port 8002
  - **autism_3** — ASR (Whisper), port 8003
  - **autism_4** — LLM (Ollama), port 8004

  Activate the corresponding env before running each service (e.g. from repo root: `conda activate autism_4` then `uvicorn services.llm_service.main:app --port 8004`).

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
