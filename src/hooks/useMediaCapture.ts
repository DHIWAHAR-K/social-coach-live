import { useCallback, useRef, useState } from "react";
import type { AudioChunk } from "@/lib/api";

const TARGET_SAMPLE_RATE = 16000;
const CHUNK_DURATION_SEC = 4;

function encodeWav(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.byteLength);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.byteLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.byteLength, true);
  new Int16Array(buffer, 44).set(samples);
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function downsampleTo16k(
  float32Samples: Float32Array,
  sourceSampleRate: number
): Int16Array {
  const numOut = Math.floor(
    (float32Samples.length * TARGET_SAMPLE_RATE) / sourceSampleRate
  );
  const out = new Int16Array(numOut);
  for (let i = 0; i < numOut; i++) {
    const srcIndex = (i * sourceSampleRate) / TARGET_SAMPLE_RATE;
    const idx0 = Math.floor(srcIndex);
    const idx1 = Math.min(idx0 + 1, float32Samples.length - 1);
    const frac = srcIndex - idx0;
    const s =
      float32Samples[idx0] * (1 - frac) + float32Samples[idx1] * frac;
    out[i] = Math.max(
      -32768,
      Math.min(32767, Math.round(s * 32767))
    );
  }
  return out;
}

export function useMediaCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const bufferRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const onChunkReadyRef = useRef<(chunk: AudioChunk) => void>(() => {});

  const startCapture = useCallback(
    async (onChunkReady: (chunk: AudioChunk) => void) => {
      onChunkReadyRef.current = onChunkReady;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        const ctx = new AudioContext();
        contextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const bufferSize = 4096;
        const scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1);
        nodeRef.current = scriptNode;
        bufferRef.current = [];
        startTimeRef.current = ctx.currentTime;

        scriptNode.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          for (let i = 0; i < input.length; i++) {
            bufferRef.current.push(input[i]);
          }
          const sampleRate = ctx.sampleRate;
          const samplesNeeded = CHUNK_DURATION_SEC * sampleRate;
          if (bufferRef.current.length >= samplesNeeded) {
            const floats = new Float32Array(bufferRef.current.splice(0, samplesNeeded));
            const int16 = downsampleTo16k(floats, sampleRate);
            const wav = encodeWav(int16, TARGET_SAMPLE_RATE);
            const audioBase64 = arrayBufferToBase64(wav);
            const now = ctx.currentTime;
            const tStart = startTimeRef.current;
            startTimeRef.current = now;
            const chunk: AudioChunk = {
              chunk_id: crypto.randomUUID(),
              timestamp_start: tStart,
              timestamp_end: now,
              audio_base64: audioBase64,
            };
            onChunkReadyRef.current(chunk);
          }
        };

        source.connect(scriptNode);
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;
        scriptNode.connect(silentGain);
        silentGain.connect(ctx.destination);
        setIsCapturing(true);
      } catch (err) {
        setIsCapturing(false);
        throw err;
      }
    },
    []
  );

  const stopCapture = useCallback(() => {
    const node = nodeRef.current;
    if (node) {
      node.disconnect();
      nodeRef.current = null;
    }
    const ctx = contextRef.current;
    if (ctx) {
      ctx.close().catch(() => {});
      contextRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    bufferRef.current = [];
    setIsCapturing(false);
  }, []);

  return { isCapturing, startCapture, stopCapture };
}
