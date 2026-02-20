import { useState, useEffect, useCallback } from "react";
import { Caption, Explanation } from "@/types/meeting";
import { participants, scriptLines } from "@/data/mockConversation";
import TopBar from "@/components/meeting/TopBar";
import VideoGrid from "@/components/meeting/VideoGrid";
import BottomControls from "@/components/meeting/BottomControls";
import CoachPanel from "@/components/meeting/CoachPanel";

const MeetingPage = () => {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [coachOpen, setCoachOpen] = useState(true);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);

  const addNextCaption = useCallback(() => {
    if (scriptIndex >= scriptLines.length) return;

    const line = scriptLines[scriptIndex];
    const speaker = participants.find((p) => p.id === line.speakerId);
    const captionId = `caption-${scriptIndex}`;

    const newCaption: Caption = {
      id: captionId,
      speakerId: line.speakerId,
      speakerName: speaker?.name || "Unknown",
      text: line.text,
      timestamp: Date.now(),
    };

    const newExplanation: Explanation = {
      id: `exp-${scriptIndex}`,
      captionId,
      text: line.explanation,
    };

    setCaptions((prev) => [...prev, newCaption]);
    setExplanation(newExplanation);
    setActiveSpeakerId(line.speakerId);
    setScriptIndex((prev) => prev + 1);
  }, [scriptIndex]);

  useEffect(() => {
    if (sessionEnded || scriptIndex >= scriptLines.length) return;

    const delay = 4000 + Math.random() * 2000;
    const timer = setTimeout(addNextCaption, delay);
    return () => clearTimeout(timer);
  }, [scriptIndex, sessionEnded, addNextCaption]);

  const handleEndSession = () => {
    setSessionEnded(true);
    setActiveSpeakerId(null);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar onEndSession={handleEndSession} />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-col flex-1 min-w-0">
          <VideoGrid participants={participants} activeSpeakerId={activeSpeakerId} />
          <BottomControls
            micOn={micOn}
            cameraOn={cameraOn}
            coachOpen={coachOpen}
            onToggleMic={() => setMicOn((v) => !v)}
            onToggleCamera={() => setCameraOn((v) => !v)}
            onToggleCoach={() => setCoachOpen((v) => !v)}
          />
        </main>

        <CoachPanel
          isOpen={coachOpen}
          onClose={() => setCoachOpen(false)}
          captions={captions}
          explanation={explanation}
        />
      </div>

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
