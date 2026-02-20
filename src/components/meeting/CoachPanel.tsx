import { Caption, Explanation } from "@/types/meeting";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
      className="w-[340px] flex flex-col shrink-0 border-l"
      style={{
        backgroundColor: "hsl(var(--coach-bg))",
        borderColor: "hsl(var(--coach-border))",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "hsl(var(--coach-border))" }}
      >
        <h2 className="text-sm font-medium" style={{ color: "hsl(var(--coach-fg))" }}>
          In-call messages
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Toggle row */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "hsl(var(--coach-border))" }}
      >
        <span className="text-xs" style={{ color: "hsl(var(--coach-muted))" }}>
          Let everyone send messages
        </span>
        <Switch defaultChecked className="scale-75" />
      </div>

      {/* Captions + Explanation */}
      <CaptionsList captions={captions} />
      <ExplanationBox explanation={explanation} />
    </aside>
  );
};

export default CoachPanel;
