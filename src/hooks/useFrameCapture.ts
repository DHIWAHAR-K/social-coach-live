import { useCallback, useRef, useState } from "react";
import type { Frame } from "@/lib/api";

const MAX_WIDTH = 640;
const MAX_HEIGHT = 480;
const DATA_URL_PREFIX = "data:image/jpeg;base64,";

export function useFrameCapture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  captureIntervalMs: number = 1000
) {
  const bufferRef = useRef<Frame[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capturingRef = useRef(false);
  const videoRefRef = useRef(videoRef);
  const intervalMsRef = useRef(captureIntervalMs);
  videoRefRef.current = videoRef;
  intervalMsRef.current = captureIntervalMs;

  const [dimensions, setDimensions] = useState({ captureWidth: MAX_WIDTH, captureHeight: MAX_HEIGHT });

  const startFrameCapture = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    capturingRef.current = true;
    const ms = intervalMsRef.current;
    intervalRef.current = setInterval(() => {
      const video = videoRefRef.current?.current;
      if (!video || video.readyState < 2 || video.paused) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw === 0 || vh === 0) return;
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
      setDimensions((prev) => (prev.captureWidth === w && prev.captureHeight === h ? prev : { captureWidth: w, captureHeight: h }));
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const image_base64 = dataUrl.startsWith(DATA_URL_PREFIX)
        ? dataUrl.slice(DATA_URL_PREFIX.length)
        : dataUrl;
      bufferRef.current.push({
        frame_id: crypto.randomUUID(),
        timestamp: Date.now() / 1000,
        image_base64,
      });
    }, ms);
  }, []);

  const stopFrameCapture = useCallback(() => {
    capturingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const drainFrames = useCallback((): Frame[] => {
    const frames = bufferRef.current;
    bufferRef.current = [];
    return frames;
  }, []);

  return { startFrameCapture, stopFrameCapture, drainFrames, captureWidth: dimensions.captureWidth, captureHeight: dimensions.captureHeight };
}
