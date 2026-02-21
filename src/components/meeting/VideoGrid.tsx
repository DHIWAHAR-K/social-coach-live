import { Participant } from "@/types/meeting";
import ParticipantTile from "./ParticipantTile";

interface VideoGridProps {
  participants: Participant[];
  activeSpeakerId: string | null;
  localVideoRef?: React.RefObject<HTMLVideoElement | null>;
}

const VideoGrid = ({ participants, activeSpeakerId, localVideoRef }: VideoGridProps) => {
  // If only one active speaker or default, show main speaker large + small tiles
  const mainSpeaker = participants.find((p) => p.id === activeSpeakerId) || participants[0];
  const others = participants.filter((p) => p.id !== mainSpeaker.id);

  return (
    <div className="flex-1 relative" style={{ backgroundColor: "hsl(var(--meet-surface))" }}>
      {/* Main large tile */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <ParticipantTile
          participant={mainSpeaker}
          isActiveSpeaker={activeSpeakerId === mainSpeaker.id}
          variant="large"
          streamRef={mainSpeaker.isLocal ? localVideoRef : undefined}
        />
      </div>

    </div>
  );
};

export default VideoGrid;
