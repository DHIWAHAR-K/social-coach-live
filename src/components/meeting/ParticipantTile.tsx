import { Participant } from "@/types/meeting";

interface ParticipantTileProps {
  participant: Participant;
  isActiveSpeaker: boolean;
}

const ParticipantTile = ({ participant, isActiveSpeaker }: ParticipantTileProps) => {
  return (
    <div
      className="relative rounded-xl overflow-hidden aspect-video flex items-center justify-center transition-all duration-300"
      style={{
        backgroundColor: `hsl(${participant.color} / 0.15)`,
        boxShadow: isActiveSpeaker
          ? `0 0 0 3px hsl(${participant.color}), 0 0 20px hsl(${participant.color} / 0.25)`
          : "0 0 0 1px hsl(var(--border))",
      }}
    >
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-semibold"
        style={{
          backgroundColor: `hsl(${participant.color} / 0.3)`,
          color: `hsl(${participant.color})`,
        }}
      >
        {participant.initial}
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-sm font-medium text-white/90">{participant.name}</span>
      </div>

      {isActiveSpeaker && (
        <div className="absolute top-2.5 right-2.5">
          <span className="flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: `hsl(${participant.color})` }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: `hsl(${participant.color})` }}
            />
          </span>
        </div>
      )}
    </div>
  );
};

export default ParticipantTile;
