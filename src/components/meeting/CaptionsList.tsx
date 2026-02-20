import { Caption } from "@/types/meeting";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { participants } from "@/data/mockConversation";

interface CaptionsListProps {
  captions: Caption[];
}

const speakerColorMap: Record<string, string> = {};
participants.forEach((p) => {
  speakerColorMap[p.id] = p.color;
});

const CaptionsList = ({ captions }: CaptionsListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [captions.length]);

  return (
    <ScrollArea className="flex-1 px-4 py-2">
      <div className="space-y-3">
        {captions.length === 0 && (
          <p className="text-sm italic" style={{ color: "hsl(var(--coach-muted))" }}>
            Waiting for conversation to start…
          </p>
        )}
        {captions.map((c) => {
          const color = speakerColorMap[c.speakerId] || "210 10% 50%";
          return (
            <div key={c.id} className="text-sm leading-relaxed">
              <span
                className="font-semibold mr-1.5"
                style={{ color: `hsl(${color})` }}
              >
                {c.speakerName}:
              </span>
              <span style={{ color: "hsl(var(--coach-fg))" }}>{c.text}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};

export default CaptionsList;
