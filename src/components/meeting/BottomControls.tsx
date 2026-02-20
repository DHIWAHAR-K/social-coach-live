import { Mic, MicOff, Video, VideoOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomControlsProps {
  micOn: boolean;
  cameraOn: boolean;
  coachOpen: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleCoach: () => void;
}

const BottomControls = ({
  micOn,
  cameraOn,
  coachOpen,
  onToggleMic,
  onToggleCamera,
  onToggleCoach,
}: BottomControlsProps) => {
  return (
    <div className="flex justify-center py-4 px-4">
      <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 border border-border shadow-lg">
        <Button
          variant={micOn ? "ghost" : "destructive"}
          size="icon"
          className="rounded-full h-11 w-11"
          onClick={onToggleMic}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={cameraOn ? "ghost" : "destructive"}
          size="icon"
          className="rounded-full h-11 w-11"
          onClick={onToggleCamera}
        >
          {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant={coachOpen ? "default" : "ghost"}
          size="icon"
          className="rounded-full h-11 w-11"
          onClick={onToggleCoach}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default BottomControls;
