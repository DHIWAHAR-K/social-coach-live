import { useEffect, useRef } from "react";
import { Participant } from "@/types/meeting";
import type { DetectedFace } from "@/lib/api";

const FRAME_SOURCE_WIDTH = 640;
const FRAME_SOURCE_HEIGHT = 480;

interface ParticipantTileProps {
  participant: Participant;
  isActiveSpeaker: boolean;
  variant?: "large" | "small";
  streamRef?: React.RefObject<HTMLVideoElement | null>;
  detectedFaces?: DetectedFace[];
}

const ParticipantTile = ({ participant, isActiveSpeaker, variant = "large", streamRef, detectedFaces }: ParticipantTileProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  if (variant === "small") {
    return (
      <div
        className="relative rounded-lg overflow-hidden flex items-center justify-center w-28 h-20 shrink-0"
        style={{
          backgroundColor: `hsl(${participant.color} / 0.2)`,
          boxShadow: isActiveSpeaker
            ? `0 0 0 2px hsl(${participant.color})`
            : "0 0 0 1px hsl(var(--border))",
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{
            backgroundColor: `hsl(${participant.color} / 0.35)`,
            color: `hsl(${participant.color})`,
          }}
        >
          {participant.initial}
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-2 py-0.5 bg-gradient-to-t from-black/60 to-transparent">
          <span className="text-[10px] font-medium text-white/80">{participant.name}</span>
        </div>
      </div>
    );
  }

  // Draw face bboxes on canvas overlay when we have video and detected faces
  useEffect(() => {
    const video = streamRef?.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !detectedFaces?.length) {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const cw = video.clientWidth;
    const ch = video.clientHeight;
    if (cw === 0 || ch === 0) return;
    canvas.width = cw;
    canvas.height = ch;
    const scaleX = cw / FRAME_SOURCE_WIDTH;
    const scaleY = ch / FRAME_SOURCE_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    for (const face of detectedFaces) {
      const [x, y, w, h] = face.bbox;
      if (face.bbox.length < 4) continue;
      ctx.strokeRect(
        Math.round(x * scaleX),
        Math.round(y * scaleY),
        Math.round(w * scaleX),
        Math.round(h * scaleY)
      );
    }
  }, [streamRef, detectedFaces]);

  return (
    <div
      className="relative overflow-hidden flex items-center justify-center w-full h-full"
      style={{
        backgroundColor: streamRef ? "#000000" : `hsl(${participant.color} / 0.18)`,
      }}
    >
      {streamRef && (
        <video
          ref={streamRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover absolute inset-0"
        />
      )}
      {streamRef && detectedFaces && detectedFaces.length > 0 && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ objectFit: "cover" }}
        />
      )}
      {!streamRef && (
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold"
          style={{
            backgroundColor: `hsl(${participant.color} / 0.35)`,
            color: `hsl(${participant.color})`,
          }}
        >
          {participant.initial}
        </div>
      )}

      {/* Name label at bottom-left, Google Meet style */}
      <div className="absolute bottom-2 left-3">
        <span className="text-xs font-medium text-white/90">{participant.name}</span>
      </div>
    </div>
  );
};

export default ParticipantTile;
