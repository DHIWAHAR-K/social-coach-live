import { useState, useEffect, useCallback, useRef } from "react";
import { Caption, Explanation, Participant } from "@/types/meeting";
import VideoGrid from "@/components/meeting/VideoGrid";
import BottomControls from "@/components/meeting/BottomControls";
import CoachPanel from "@/components/meeting/CoachPanel";
import ExplanationPanel from "@/components/meeting/ExplanationPanel";
import { analyzeMessage, analyzeMedia, formatExplanationForPanel } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useMediaCapture } from "@/hooks/useMediaCapture";
import { useFrameCapture } from "@/hooks/useFrameCapture";
import { useRealtimeFaces } from "@/hooks/useRealtimeFaces";

const PARTICIPANTS: Participant[] = [
  { id: "you", name: "You", color: "210 60% 45%", initial: "Y", isLocal: true },
  { id: "person-a", name: "Person A", color: "150 50% 40%", initial: "A", isLocal: false },
];

const MeetingPage = () => {
  const { toast } = useToast();
  const { startCapture, stopCapture } = useMediaCapture();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const { startFrameCapture, stopFrameCapture, drainFrames } = useFrameCapture(localVideoRef, 1000);
  const { detectedFaces, captureWidth, captureHeight, connect: connectFaces, disconnect: disconnectFaces } = useRealtimeFaces();
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [coachOpen, setCoachOpen] = useState(true);
  const [explanationPanelOpen, setExplanationPanelOpen] = useState(true);
  const [liveCoachOn, setLiveCoachOn] = useState(false); // center mic = Live Coach on/off
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sendLoading, setSendLoading] = useState(false);

  // Elapsed time timer
  useEffect(() => {
    if (sessionEnded) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionEnded]);

  const handleEndSession = () => {
    setSessionEnded(true);
  };

  const handleSendMessage = useCallback(
    async (text: string) => {
      setSendLoading(true);
      try {
        const msg = {
          id: `msg-${Date.now()}`,
          speaker_id: "you",
          speaker_name: "You",
          text,
          timestamp: Date.now() / 1000,
        };
        const result = await analyzeMessage(msg);
        const exp: Explanation = {
          id: result.id,
          captionId: msg.id,
          text: formatExplanationForPanel(result),
        };
        setExplanations((prev) => [...prev, exp]);
        setExplanation(exp);
      } catch (err) {
        toast({
          title: "Social Coach unavailable",
          description: err instanceof Error ? err.message : "Request failed",
          variant: "destructive",
        });
      } finally {
        setSendLoading(false);
      }
    },
    [toast]
  );

  const handleChunkReady = useCallback(
    async (chunk: import("@/lib/api").AudioChunk): Promise<void> => {
      try {
        const response = await analyzeMedia({
          frames: drainFrames(),
          audio_chunks: [chunk],
        });
        const turns = response.turns as { turn_id: string; speaker_id: string; speaker_name: string; text: string; start: number }[];
        const mappedCaptions: Caption[] = turns.map((turn) => ({
          id: turn.turn_id,
          speakerId: turn.speaker_id,
          speakerName: turn.speaker_name,
          text: turn.text,
          timestamp: turn.start,
        }));
        if (mappedCaptions.length > 0) {
          setCaptions((prev) => [...prev, ...mappedCaptions]);
        }
        const mapped: Explanation[] = response.explanations.map((exp) => ({
          id: exp.id,
          captionId: exp.turn_id,
          text: formatExplanationForPanel(exp),
        }));
        if (mapped.length > 0) {
          setExplanations((prev) => [...prev, ...mapped]);
          setExplanation(mapped[mapped.length - 1]);
        }
      } catch (err) {
        toast({
          title: "Live Coach unavailable",
          description: err instanceof Error ? err.message : "Request failed",
          variant: "destructive",
        });
      }
    },
    [toast, drainFrames]
  );

  const handleToggleLiveCoach = useCallback(async () => {
    if (liveCoachOn) {
      stopCapture();
      stopFrameCapture();
      setLiveCoachOn(false);
      return;
    }
    try {
      startFrameCapture();
      await startCapture(handleChunkReady);
      setLiveCoachOn(true);
    } catch (err) {
      stopFrameCapture();
      toast({
        title: "Microphone access denied",
        description: err instanceof Error ? err.message : "Could not start Live Coach",
        variant: "destructive",
      });
    }
  }, [liveCoachOn, startCapture, stopCapture, startFrameCapture, stopFrameCapture, handleChunkReady, toast]);

  const handleToggleCamera = useCallback(async () => {
    try {
      if (cameraOn) {
        cameraStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        setCameraOn(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStreamRef.current = stream;
        setCameraOn(true);
      }
    } catch (err) {
      toast({
        title: "Camera access denied",
        description: err instanceof Error ? err.message : "Could not access camera",
        variant: "destructive",
      });
    }
  }, [cameraOn, toast]);

  // Attach stream to video element after render when camera turns on
  useEffect(() => {
    if (cameraOn && cameraStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [cameraOn]);

  // Connect/disconnect real-time face detection whenever camera state changes
  useEffect(() => {
    if (cameraOn) {
      connectFaces(localVideoRef);
    } else {
      disconnectFaces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Left explanation panel */}
      <ExplanationPanel
        isOpen={explanationPanelOpen}
        onClose={() => setExplanationPanelOpen(false)}
        explanations={explanations}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Video area */}
        <VideoGrid participants={PARTICIPANTS} activeSpeakerId={null} localVideoRef={localVideoRef} cameraOn={cameraOn} detectedFaces={detectedFaces} frameSourceWidth={captureWidth} frameSourceHeight={captureHeight} />

        {/* Bottom-left meeting info */}
        <div className="absolute bottom-20 left-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatTime(elapsedSeconds)}</span>
          <span className="opacity-50">|</span>
          <span>stk-abc-xyz</span>
        </div>

        {/* Bottom controls */}
        <BottomControls
          micOn={liveCoachOn}
          onToggleMic={handleToggleLiveCoach}
          cameraOn={cameraOn}
          coachOpen={coachOpen}
          explanationOpen={explanationPanelOpen}
          onToggleCamera={handleToggleCamera}
          onToggleCoach={() => setCoachOpen((v) => !v)}
          onToggleExplanation={() => setExplanationPanelOpen((v) => !v)}
          onEndSession={handleEndSession}
        />
      </div>

      {/* Right panel */}
      <CoachPanel
        isOpen={coachOpen}
        onClose={() => setCoachOpen(false)}
        captions={captions}
        explanation={explanation}
        onSendMessage={handleSendMessage}
        sendLoading={sendLoading}
      />

      {sessionEnded && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Session Ended</h2>
            <p className="text-muted-foreground">The conversation session has been ended.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingPage;
