import { useCallback, useRef, useState } from "react";
import type { DetectedFace } from "@/lib/api";

const MAX_WIDTH = 640;
const MAX_HEIGHT = 480;
const DATA_URL_PREFIX = "data:image/jpeg;base64,";
const FRAME_INTERVAL_MS = 100; // ~10 fps

const ORCHESTRATOR_URL =
  (import.meta.env.VITE_ORCHESTRATOR_URL as string | undefined) ??
  "http://localhost:8000";

// Convert http(s):// to ws(s)://
const WS_URL = ORCHESTRATOR_URL.replace(/^http/, "ws") + "/ws/faces";

export function useRealtimeFaces() {
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [captureWidth, setCaptureWidth] = useState(MAX_WIDTH);
  const [captureHeight, setCaptureHeight] = useState(MAX_HEIGHT);

  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRefRef = useRef<React.RefObject<HTMLVideoElement | null> | null>(null);

  const _stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    _stopInterval();
    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setDetectedFaces([]);
  }, [_stopInterval]);

  const connect = useCallback(
    (videoRef: React.RefObject<HTMLVideoElement | null>) => {
      // Close any existing connection first
      disconnect();
      videoRefRef.current = videoRef;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        // Start capturing frames and sending them
        intervalRef.current = setInterval(() => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const video = videoRefRef.current?.current;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;

          const vw = video.videoWidth;
          const vh = video.videoHeight;
          let w = vw;
          let h = vh;
          if (w > MAX_WIDTH || h > MAX_HEIGHT) {
            const r = Math.min(MAX_WIDTH / w, MAX_HEIGHT / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, w, h);

          setCaptureWidth((prev) => (prev === w ? prev : w));
          setCaptureHeight((prev) => (prev === h ? prev : h));

          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          const image_base64 = dataUrl.startsWith(DATA_URL_PREFIX)
            ? dataUrl.slice(DATA_URL_PREFIX.length)
            : dataUrl;

          ws.send(
            JSON.stringify({
              frame_id: crypto.randomUUID(),
              timestamp: Date.now() / 1000,
              image_base64,
            })
          );
        }, FRAME_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        try {
          const faces = JSON.parse(event.data as string) as DetectedFace[];
          setDetectedFaces(faces);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = (err) => {
        console.error("[useRealtimeFaces] WebSocket error", err);
        _stopInterval();
      };

      ws.onclose = () => {
        _stopInterval();
      };
    },
    [disconnect, _stopInterval]
  );

  return { detectedFaces, captureWidth, captureHeight, connect, disconnect };
}
