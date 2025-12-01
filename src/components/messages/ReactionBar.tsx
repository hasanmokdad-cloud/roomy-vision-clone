import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReactionBarProps {
  onReactionSelect: (emoji: string) => void;
  onOpenFullPicker: () => void;
  selectedEmojis?: string[];
}

const WHATSAPP_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "👏"];

export function ReactionBar({ onReactionSelect, onOpenFullPicker, selectedEmojis = [] }: ReactionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute -top-14 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-popover border border-border rounded-full shadow-lg px-2 py-2 flex items-center gap-1">
        {WHATSAPP_REACTIONS.map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className={`h-10 w-10 p-0 text-2xl hover:scale-110 transition-transform ${
              selectedEmojis.includes(emoji) ? 'bg-accent' : ''
            }`}
            onClick={() => onReactionSelect(emoji)}
          >
            {emoji}
          </Button>
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 hover:scale-110 transition-transform"
          onClick={onOpenFullPicker}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}
