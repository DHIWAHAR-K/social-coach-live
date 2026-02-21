import { Participant } from "@/types/meeting";
import type { DetectedFace } from "@/lib/api";
import ParticipantTile from "./ParticipantTile";

interface VideoGridProps {
  participants: Participant[];
  activeSpeakerId: string | null;
  localVideoRef?: React.RefObject<HTMLVideoElement | null>;
  cameraOn?: boolean;
  detectedFaces?: DetectedFace[];
  frameSourceWidth?: number;
  frameSourceHeight?: number;
}

const VideoGrid = ({ participants, activeSpeakerId, localVideoRef, cameraOn = true, detectedFaces, frameSourceWidth, frameSourceHeight }: VideoGridProps) => {
  const localParticipant = participants.find((p) => p.isLocal);
  const mainSpeaker = participants.find((p) => p.id === activeSpeakerId) || participants[0];
  const others = participants.filter((p) => p.id !== mainSpeaker.id);
  const isLocalTile = localParticipant != null && mainSpeaker.id === localParticipant.id;

  return (
    <div className="flex-1 relative">
      {/* Main large tile */}
      <div className="absolute inset-0">
        <ParticipantTile
          participant={mainSpeaker}
          isActiveSpeaker={activeSpeakerId === mainSpeaker.id}
          variant="large"
          streamRef={mainSpeaker.isLocal && cameraOn ? localVideoRef : undefined}
          detectedFaces={isLocalTile ? detectedFaces : undefined}
          frameSourceWidth={isLocalTile ? frameSourceWidth : undefined}
          frameSourceHeight={isLocalTile ? frameSourceHeight : undefined}
        />
      </div>

    </div>
  );
};

export default VideoGrid;
