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
      className="relative rounded-lg overflow-hidden flex items-center justify-center w-full h-full"
      style={{
        backgroundColor: "#000000",
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
        <div className="flex flex-col items-center justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-semibold"
            style={{
              backgroundColor: `hsl(${participant.color} / 0.3)`,
              color: `hsl(${participant.color})`,
            }}
          >
            {participant.initial}
          </div>
          <p className="mt-3 text-white/80 text-sm font-medium">{participant.name}</p>
        </div>
      )}

      {/* Name pill at bottom-left, Google Meet style */}
      <div className="absolute bottom-3 left-3">
        <span className="inline-flex items-center bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {participant.name}
        </span>
      </div>
    </div>
  );
};

export default ParticipantTile;
