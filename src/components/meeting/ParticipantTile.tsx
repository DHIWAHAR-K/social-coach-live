import { Participant } from "@/types/meeting";

interface ParticipantTileProps {
  participant: Participant;
  isActiveSpeaker: boolean;
  variant?: "large" | "small";
  streamRef?: React.RefObject<HTMLVideoElement | null>;
}

const ParticipantTile = ({ participant, isActiveSpeaker, variant = "large", streamRef }: ParticipantTileProps) => {
  if (variant === "small") {
    return (
      <div
        className="relative rounded-lg overflow-hidden flex items-center justify-center w-28 h-20 shrink-0"
        style={{
          backgroundColor: `hsl(${participant.color} / 0.2)`,
          boxShadow: isActiveSpeaker
            ? `0 0 0 2px hsl(${participant.color})`
            : "0 0 0 1px hsl(var(--border))",
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{
            backgroundColor: `hsl(${participant.color} / 0.35)`,
            color: `hsl(${participant.color})`,
          }}
        >
          {participant.initial}
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-2 py-0.5 bg-gradient-to-t from-black/60 to-transparent">
          <span className="text-[10px] font-medium text-white/80">{participant.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden flex items-center justify-center w-full h-full"
      style={{
        backgroundColor: streamRef ? "#000000" : `hsl(${participant.color} / 0.18)`,
      }}
    >
      {streamRef && (
        <video
          ref={streamRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover absolute inset-0"
        />
      )}
      {!streamRef && (
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold"
          style={{
            backgroundColor: `hsl(${participant.color} / 0.35)`,
            color: `hsl(${participant.color})`,
          }}
        >
          {participant.initial}
        </div>
      )}

      {/* Name label at bottom-left, Google Meet style */}
      <div className="absolute bottom-2 left-3">
        <span className="text-xs font-medium text-white/90">{participant.name}</span>
      </div>
    </div>
  );
};

export default ParticipantTile;
