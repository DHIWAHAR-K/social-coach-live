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
    <ScrollArea className="flex-1 px-4 py-3">
      <div className="space-y-3">
        {captions.length === 0 && (
          <p className="text-xs" style={{ color: "hsl(var(--coach-muted))" }}>
            Messages will appear here…
          </p>
        )}
        {captions.map((c) => {
          const color = speakerColorMap[c.speakerId] || "210 10% 50%";
          return (
            <div key={c.id} className="text-sm leading-relaxed">
              <span
                className="font-medium mr-1.5 text-xs"
                style={{ color: `hsl(${color})` }}
              >
                {c.speakerName}
              </span>
              <span className="text-xs" style={{ color: "hsl(var(--coach-fg))" }}>{c.text}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};

export default CaptionsList;
