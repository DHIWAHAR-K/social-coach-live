import { Explanation } from "@/types/meeting";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Lightbulb, Brain } from "lucide-react";
import { useEffect, useRef } from "react";

interface ExplanationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  explanations: Explanation[];
}

const ExplanationPanel = ({ isOpen, onClose, explanations }: ExplanationPanelProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [explanations.length]);

  return (
    <aside
      className={`flex flex-col shrink-0 bg-[#1e1e1e] overflow-hidden transition-all duration-300 ease-in-out border-r border-[#303134] ${
        isOpen ? "w-[340px] opacity-100" : "w-0 opacity-0 pointer-events-none border-r-0"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="text-[15px] font-medium text-[#e3e3e3]">
            Social Coach
          </h2>
        </div>
        <button
          className="text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Info */}
      <div className="mx-4 mt-1 mb-3 rounded-lg bg-[#28292c] px-4 py-3">
        <p className="text-[11px] leading-relaxed text-[#9aa0a6]">
          AI-powered interpretations of what others are saying — helping you understand tone, intent, and social cues.
        </p>
      </div>

      {/* Explanations list */}
      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-3">
          {explanations.length === 0 && (
            <p className="text-[12px] text-[#9aa0a6] text-center mt-8">
              Explanations will appear here as people speak…
            </p>
          )}
          {explanations.map((exp, i) => (
            <div
              key={exp.id}
              className="rounded-lg p-3 border border-[#303134] bg-[#28292c]"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa0a6]">
                  Interpretation #{i + 1}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-[#e3e3e3]">
                {exp.text}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </aside>
  );
};

export default ExplanationPanel;
