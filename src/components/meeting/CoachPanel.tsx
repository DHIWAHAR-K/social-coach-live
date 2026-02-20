import { Caption, Explanation } from "@/types/meeting";
import { X, Send, Info, Monitor, Grid3X3, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import CaptionsList from "./CaptionsList";
import ExplanationBox from "./ExplanationBox";

interface CoachPanelProps {
  isOpen: boolean;
  onClose: () => void;
  captions: Caption[];
  explanation: Explanation | null;
}

const CoachPanel = ({ isOpen, onClose, captions, explanation }: CoachPanelProps) => {
  const [message, setMessage] = useState("");

  return (
    <aside
      className={`flex flex-col shrink-0 bg-[#1e1e1e] overflow-hidden transition-all duration-300 ease-in-out border-l border-[#303134] ${
        isOpen ? "w-[360px] opacity-100" : "w-0 opacity-0 pointer-events-none border-l-0"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[15px] font-medium text-[#e3e3e3]">
          In-call messages
        </h2>
        <button
          className="text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Toggle row */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#303134]">
        <span className="text-[13px] text-[#c4c7c5]">
          Let participants send messages
        </span>
        <Switch defaultChecked className="scale-90" />
      </div>

      {/* Info banner */}
      <div className="mx-4 mt-2 rounded-lg bg-[#28292c] px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Monitor className="h-3.5 w-3.5 text-[#9aa0a6]" />
          <span className="text-[12px] font-medium text-[#c4c7c5]">Continuous chat is OFF</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#9aa0a6]">
          Messages won't be saved when the call ends. You can pin a message to make it visible for people who join later.
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <CaptionsList captions={captions} />
        {explanation && <ExplanationBox explanation={explanation} />}
      </div>

      {/* Message input */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-[#28292c] rounded-full px-4 py-2.5 border border-[#3c4043]">
          <input
            type="text"
            placeholder="Send a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-[#e3e3e3] placeholder-[#9aa0a6] outline-none"
          />
          <button className="text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};

export default CoachPanel;
