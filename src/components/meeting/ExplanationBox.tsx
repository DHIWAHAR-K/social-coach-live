import { Explanation } from "@/types/meeting";
import { Lightbulb } from "lucide-react";

interface ExplanationBoxProps {
  explanation: Explanation | null;
}

const ExplanationBox = ({ explanation }: ExplanationBoxProps) => {
  return (
    <div
      className="mx-3 mb-3 rounded-lg p-3 border"
      style={{
        backgroundColor: "hsl(var(--coach-card))",
        borderColor: "hsl(var(--coach-border))",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Lightbulb className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary))" }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--coach-muted))" }}>
          AI Interpretation
        </span>
      </div>
      {explanation ? (
        <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--coach-fg))" }}>
          {explanation.text}
        </p>
      ) : (
        <p className="text-xs italic" style={{ color: "hsl(var(--coach-muted))" }}>
          Explanations will appear here…
        </p>
      )}
    </div>
  );
};

export default ExplanationBox;
