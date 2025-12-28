import { useIsMobile } from "@/hooks/use-mobile";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTheme } from "@/contexts/ThemeContext";
import { useCallback } from "react";

interface EmojiPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  mode?: "reaction" | "input";
  anchorPosition?: { x: number; y: number };
}

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

  const handleEmojiClick = useCallback((emojiData: any) => {
    const emoji = emojiData.emoji;
    onEmojiSelect(emoji);
    onOpenChange(false);
  }, [onEmojiSelect, onOpenChange]);

  const emojiPickerTheme = theme === "dark" ? Theme.DARK : Theme.LIGHT;

  // Calculate smart position for desktop picker - ensures fully visible
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
    
    // Calculate space above and below the anchor
    const spaceAbove = anchorPosition.y - padding;
    const spaceBelow = viewportHeight - anchorPosition.y - padding;
    
    let top: number;
    
    // If enough space above, position above (preferred)
    if (spaceAbove >= pickerHeight) {
      top = anchorPosition.y - pickerHeight - padding;
    } 
    // If enough space below, position below
    else if (spaceBelow >= pickerHeight) {
      top = anchorPosition.y + padding + 50; // 50px offset for the message bubble height
    }
    // If neither has enough space, position at top of viewport
    else {
      top = padding;
    }

    // Keep within horizontal bounds
    if (left + pickerWidth > viewportWidth - padding) {
      left = viewportWidth - pickerWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    // Final vertical bounds check
    if (top + pickerHeight > viewportHeight - padding) {
      top = viewportHeight - pickerHeight - padding;
    }
    if (top < padding) {
      top = padding;
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
              skinTonesDisabled={false}
              emojiStyle={EmojiStyle.NATIVE}
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
                skinTonesDisabled={false}
                emojiStyle={EmojiStyle.NATIVE}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return null;
}
