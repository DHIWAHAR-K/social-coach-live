import { Caption } from "@/types/meeting";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { Pin } from "lucide-react";

interface CaptionsListProps {
  captions: Caption[];
}

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const CaptionsList = ({ captions }: CaptionsListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [captions.length]);

  return (
    <ScrollArea className="flex-1 px-4 py-3">
      <div className="space-y-2">
        {captions.length === 0 && (
          <p className="text-[12px] text-[#9aa0a6] text-center mt-8">
            No messages yet
          </p>
        )}
        {captions.map((c) => (
          <div key={c.id} className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] text-[#9aa0a6]">{formatTime(c.timestamp)}</span>
            <div className="group relative bg-[#1a73e8] rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%]">
              <p className="text-[13px] text-white font-medium">{c.speakerName}</p>
              <p className="text-[13px] text-[#e8eaed] leading-relaxed">{c.text}</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-[#a8c7fa]">
                <span>Hover over a message to pin it</span>
                <Pin className="h-3 w-3" />
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};

export default CaptionsList;
