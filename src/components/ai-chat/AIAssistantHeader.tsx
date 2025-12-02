import { Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface AIAssistantHeaderProps {
  needDorm?: boolean;
  needRoommate?: boolean;
  showContextPills?: boolean;
  onToggleContext?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export function AIAssistantHeader({
  needDorm,
  needRoommate,
  showContextPills,
  onToggleContext,
  onClose,
  isMobile = false,
}: AIAssistantHeaderProps) {
  const getSubtitle = () => {
    if (needDorm) return "Your personal housing assistant";
    if (needRoommate) return "Your roommate-matching assistant";
    return "Ask me anything about dorms, roommates, and Roomy";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 backdrop-blur-xl border-b border-border/50"
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {/* Glowing AI Avatar */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-secondary to-primary blur-md opacity-60 animate-pulse" />
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
          </motion.div>

          {/* Title and Subtitle */}
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Roomy AI
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                Beta
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">{getSubtitle()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Context Toggle Button */}
          {onToggleContext && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleContext}
              className="text-muted-foreground hover:text-foreground"
            >
              {showContextPills ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="ml-1 text-xs hidden sm:inline">Context</span>
            </Button>
          )}

          {/* Close Button (Mobile) */}
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
