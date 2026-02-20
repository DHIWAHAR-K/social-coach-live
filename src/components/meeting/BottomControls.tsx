import { Mic, MicOff, Video, VideoOff, MessageSquare, MonitorUp, SmilePlus, MoreVertical, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomControlsProps {
  micOn: boolean;
  cameraOn: boolean;
  coachOpen: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleCoach: () => void;
  onEndSession: () => void;
}

const BottomControls = ({
  micOn,
  cameraOn,
  coachOpen,
  onToggleMic,
  onToggleCamera,
  onToggleCoach,
  onEndSession,
}: BottomControlsProps) => {
  return (
    <div className="flex items-center justify-center py-3 px-4 relative z-20">
      <div className="flex items-center gap-2">
        {/* Mic */}
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full h-10 w-10 ${!micOn ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
          onClick={onToggleMic}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        {/* Camera */}
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full h-10 w-10 ${!cameraOn ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
          onClick={onToggleCamera}
        >
          {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        {/* Present / Screen share (placeholder) */}
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <MonitorUp className="h-5 w-5" />
        </Button>

        {/* Reactions (placeholder) */}
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <SmilePlus className="h-5 w-5" />
        </Button>

        {/* More */}
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <MoreVertical className="h-5 w-5" />
        </Button>

        {/* End call */}
        <Button
          size="icon"
          className="rounded-full h-10 w-14 bg-destructive text-destructive-foreground hover:bg-destructive/90 ml-2"
          onClick={onEndSession}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* Right-side icons */}
      <div className="absolute right-4 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full h-9 w-9 ${coachOpen ? "text-primary" : "text-muted-foreground"}`}
          onClick={onToggleCoach}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default BottomControls;
