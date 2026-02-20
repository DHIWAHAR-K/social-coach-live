import { Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  onEndSession: () => void;
}

const TopBar = ({ onEndSession }: TopBarProps) => {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">SC</span>
        </div>
        <span className="text-foreground font-semibold text-lg tracking-tight">Social Coach</span>
      </div>

      <span className="text-muted-foreground text-sm font-medium hidden sm:block">
        Conversation Session
      </span>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">Y</AvatarFallback>
        </Avatar>
        <Button
          variant="destructive"
          size="sm"
          className="ml-2 gap-1.5"
          onClick={onEndSession}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">End Session</span>
        </Button>
      </div>
    </header>
  );
};

export default TopBar;
