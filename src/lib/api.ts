/**
 * Orchestrator API client. Frontend talks only to the orchestrator (single backend).
 * Set VITE_ORCHESTRATOR_URL in .env (default http://localhost:8000).
 */

const ORCHESTRATOR_URL =
  import.meta.env.VITE_ORCHESTRATOR_URL ?? "http://localhost:8000";

export interface ChatMessage {
  id: string;
  speaker_id: string;
  speaker_name: string;
  text: string;
  timestamp: number;
}

export interface LLMExplanation {
  id: string;
  turn_id: string;
  speaker_id: string;
  intent_summary: string;
  emotional_state: string;
  suggested_interpretation: string;
  suggested_reply: string;
}

export interface Frame {
  frame_id: string;
  timestamp: number;
  image_base64: string;
}

export interface AudioChunk {
  chunk_id: string;
  timestamp_start: number;
  timestamp_end: number;
  audio_base64: string;
}

export interface DetectedFace {
  face_id: string;
  frame_id: string;
  bbox: [number, number, number, number]; // [x, y, w, h]
  confidence: number;
  timestamp: number;
}

export interface MediaRequest {
  frames: Frame[];
  audio_chunks: AudioChunk[];
}

export interface MediaAnalysisResponse {
  turns: unknown[];
  explanations: LLMExplanation[];
  detected_faces: DetectedFace[];
}

/**
 * Send media (audio chunks + optional frames) to the orchestrator; returns turns and explanations.
 * Throws on non-2xx or network error.
 */
export async function analyzeMedia(
  req: MediaRequest
): Promise<MediaAnalysisResponse> {
  const res = await fetch(`${ORCHESTRATOR_URL}/analyze-media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      (detail as { detail?: string }).detail ?? `Request failed: ${res.status}`
    );
  }
  return res.json() as Promise<MediaAnalysisResponse>;
}

/**
 * Send a chat message to the orchestrator; returns Social Coach explanation.
 * Throws on non-2xx or network error (caller should handle 502 / LLM unavailable).
 */
export async function analyzeMessage(
  msg: ChatMessage
): Promise<LLMExplanation> {
  const res = await fetch(`${ORCHESTRATOR_URL}/analyze-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: msg.id,
      speaker_id: msg.speaker_id,
      speaker_name: msg.speaker_name,
      text: msg.text,
      timestamp: msg.timestamp,
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      (detail as { detail?: string }).detail ?? `Request failed: ${res.status}`
    );
  }
  return res.json() as Promise<LLMExplanation>;
}

/** Format LLMExplanation as a single string for the left Social Coach panel. */
export function formatExplanationForPanel(exp: LLMExplanation): string {
  const parts: string[] = [];
  if (exp.intent_summary)
    parts.push(`Intent: ${exp.intent_summary}`);
  if (exp.emotional_state)
    parts.push(`Emotional state: ${exp.emotional_state}`);
  if (exp.suggested_interpretation)
    parts.push(`Interpretation: ${exp.suggested_interpretation}`);
  if (exp.suggested_reply)
    parts.push(`Suggested reply: ${exp.suggested_reply}`);
  return parts.length ? parts.join("\n\n") : "No explanation available.";
}
