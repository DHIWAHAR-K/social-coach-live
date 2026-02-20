import { Explanation } from "@/types/meeting";
import { Lightbulb } from "lucide-react";

interface ExplanationBoxProps {
  explanation: Explanation | null;
}

const ExplanationBox = ({ explanation }: ExplanationBoxProps) => {
  return (
    <div
      className="mx-4 mb-4 rounded-xl p-4 border transition-all duration-300"
      style={{
        backgroundColor: "hsl(var(--coach-card))",
        borderColor: "hsl(var(--coach-border))",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--coach-muted))" }}>
          AI Interpretation
        </span>
      </div>
      {explanation ? (
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--coach-fg))" }}>
          {explanation.text}
        </p>
      ) : (
        <p className="text-sm italic" style={{ color: "hsl(var(--coach-muted))" }}>
          Explanations will appear here as people speak…
        </p>
      )}
    </div>
  );
};

export default ExplanationBox;
