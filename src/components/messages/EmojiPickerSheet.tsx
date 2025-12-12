import { useIsMobile } from "@/hooks/use-mobile";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";

interface EmojiPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  mode?: "reaction" | "input";
}

export function EmojiPickerSheet({
  open,
  onOpenChange,
  onEmojiSelect,
  trigger,
  mode = "input",
}: EmojiPickerSheetProps) {
  const isMobile = useIsMobile();
  const { theme } = useTheme();

  const handleEmojiClick = (emojiData: any) => {
    onEmojiSelect(emojiData.emoji);
    onOpenChange(false);
  };

  const emojiPickerTheme = theme === "dark" ? Theme.DARK : Theme.LIGHT;

  // Close on outside click for desktop - but not when clicking inside emoji picker
  useEffect(() => {
    if (!open || isMobile) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is inside emoji picker or any of its internal components
      // emoji-picker-react uses classes starting with 'epr-' and 'EmojiPickerReact'
      if (
        target.closest('[role="dialog"]') ||
        target.closest('.emoji-picker-react') ||
        target.closest('.EmojiPickerReact') ||
        target.closest('[class*="epr-"]') ||
        target.className?.includes?.('epr-') ||
        target.closest('aside') // Emoji picker uses aside for category navigation
      ) {
        return; // Don't close
      }
      onOpenChange(false);
    };

    // Add listener with delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, isMobile, onOpenChange]);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>
              {mode === "reaction" ? "React with emoji" : "Choose emoji"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 flex justify-center">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={emojiPickerTheme}
              width="100%"
              height={400}
              searchPlaceHolder="Search emoji..."
              previewConfig={{ showPreview: false }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: use Dialog (modal) instead of Popover when no trigger
  if (!trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-auto p-0 border-0 max-w-fit">
          <DialogTitle className="sr-only">Choose emoji</DialogTitle>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={emojiPickerTheme}
            width={350}
            height={400}
            searchPlaceHolder="Search emoji..."
            previewConfig={{ showPreview: false }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return null; // No trigger means it shouldn't render in Popover mode
}
