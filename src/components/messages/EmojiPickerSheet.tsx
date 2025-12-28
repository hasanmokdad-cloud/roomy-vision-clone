import { useIsMobile } from "@/hooks/use-mobile";
import EmojiPicker, { Theme, SuggestionMode, Categories } from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState, useCallback } from "react";

// Category configuration with 'suggested' (recent) first
const emojiCategories = [
  { category: Categories.SUGGESTED, name: 'Recently Used' },
  { category: Categories.SMILEYS_PEOPLE, name: 'Smileys & People' },
  { category: Categories.ANIMALS_NATURE, name: 'Animals & Nature' },
  { category: Categories.FOOD_DRINK, name: 'Food & Drink' },
  { category: Categories.TRAVEL_PLACES, name: 'Travel & Places' },
  { category: Categories.ACTIVITIES, name: 'Activities' },
  { category: Categories.OBJECTS, name: 'Objects' },
  { category: Categories.SYMBOLS, name: 'Symbols' },
  { category: Categories.FLAGS, name: 'Flags' },
];

interface EmojiPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  mode?: "reaction" | "input";
  anchorPosition?: { x: number; y: number };
}

// Storage key for recent emojis
const RECENT_EMOJIS_KEY = 'roomy_recent_emojis';

// Get recent emojis from localStorage
const getRecentEmojis = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Store emoji to recent list
const storeRecentEmoji = (emoji: string) => {
  try {
    const stored = getRecentEmojis();
    const filtered = stored.filter((e: string) => e !== emoji);
    const updated = [emoji, ...filtered].slice(0, 30); // Keep max 30 recent
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error storing recent emoji:', e);
  }
};

export function EmojiPickerSheet({
  open,
  onOpenChange,
  onEmojiSelect,
  trigger,
  mode = "input",
  anchorPosition,
}: EmojiPickerSheetProps) {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // Load recent emojis when opening
  useEffect(() => {
    if (open) {
      setRecentEmojis(getRecentEmojis());
    }
  }, [open]);

  const handleEmojiClick = useCallback((emojiData: any) => {
    const emoji = emojiData.emoji;
    // Store to recent emojis
    storeRecentEmoji(emoji);
    onEmojiSelect(emoji);
    onOpenChange(false);
  }, [onEmojiSelect, onOpenChange]);

  const emojiPickerTheme = theme === "dark" ? Theme.DARK : Theme.LIGHT;

  // Calculate smart position for desktop picker
  const getPickerPosition = () => {
    if (!anchorPosition) {
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    }

    const pickerWidth = 350;
    const pickerHeight = 400;
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = anchorPosition.x;
    let top = anchorPosition.y - pickerHeight - padding;

    // If not enough space above, position below
    if (top < padding) {
      top = anchorPosition.y + padding;
    }

    // Keep within horizontal bounds
    if (left + pickerWidth > viewportWidth - padding) {
      left = viewportWidth - pickerWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    // Keep within vertical bounds
    if (top + pickerHeight > viewportHeight - padding) {
      top = viewportHeight - pickerHeight - padding;
    }

    return { left: `${left}px`, top: `${top}px`, transform: 'none' };
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>
              {mode === "reaction" ? "React with emoji" : "Choose emoji"}
            </DrawerTitle>
          </DrawerHeader>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="px-4 pb-8 flex justify-center"
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={emojiPickerTheme}
              width="100%"
              height={400}
              searchPlaceHolder="Search emoji..."
              previewConfig={{ showPreview: false }}
              skinTonesDisabled={true}
              suggestedEmojisMode={SuggestionMode.RECENT}
              categories={emojiCategories}
            />
          </motion.div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use a simple positioned container instead of Dialog
  if (!trigger) {
    const position = getPickerPosition();
    
    return (
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop to catch outside clicks */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40"
              onClick={() => onOpenChange(false)}
            />
            {/* Emoji picker container - positioned smartly */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
              className="fixed z-50 bg-background rounded-lg shadow-xl border overflow-hidden"
              style={position}
              onClick={(e) => e.stopPropagation()}
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={emojiPickerTheme}
                width={350}
                height={400}
                searchPlaceHolder="Search emoji..."
                previewConfig={{ showPreview: false }}
                skinTonesDisabled={true}
                suggestedEmojisMode={SuggestionMode.RECENT}
                categories={emojiCategories}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return null;
}
