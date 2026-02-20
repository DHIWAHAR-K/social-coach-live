import { Caption, Explanation } from "@/types/meeting";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CaptionsList from "./CaptionsList";
import ExplanationBox from "./ExplanationBox";

interface CoachPanelProps {
  isOpen: boolean;
  onClose: () => void;
  captions: Caption[];
  explanation: Explanation | null;
}

const CoachPanel = ({ isOpen, onClose, captions, explanation }: CoachPanelProps) => {
  if (!isOpen) return null;

  return (
    <aside
      className="w-full sm:w-[360px] flex flex-col border-l shrink-0 transition-all duration-300"
      style={{
        backgroundColor: "hsl(var(--coach-bg))",
        borderColor: "hsl(var(--coach-border))",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "hsl(var(--coach-border))" }}
      >
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--coach-fg))" }}>
            Social Coach
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--coach-muted))" }}>
            Coach for autistic users (prototype)
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-black/5"
          onClick={onClose}
        >
          <X className="h-4 w-4" style={{ color: "hsl(var(--coach-muted))" }} />
        </Button>
      </div>

      <div
        className="px-4 py-2 border-b"
        style={{ borderColor: "hsl(var(--coach-border))" }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--coach-muted))" }}>
          Live Captions
        </span>
      </div>

      <CaptionsList captions={captions} />

      <ExplanationBox explanation={explanation} />
    </aside>
  );
};

export default CoachPanel;
