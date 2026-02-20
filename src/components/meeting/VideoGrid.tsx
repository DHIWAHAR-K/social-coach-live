import { Participant } from "@/types/meeting";
import ParticipantTile from "./ParticipantTile";

interface VideoGridProps {
  participants: Participant[];
  activeSpeakerId: string | null;
}

const VideoGrid = ({ participants, activeSpeakerId }: VideoGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 flex-1 content-center max-w-4xl mx-auto w-full">
      {participants.map((p) => (
        <ParticipantTile
          key={p.id}
          participant={p}
          isActiveSpeaker={activeSpeakerId === p.id}
        />
      ))}
    </div>
  );
};

export default VideoGrid;
