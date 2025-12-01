import { useIsMobile } from "@/hooks/use-mobile";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "@/contexts/ThemeContext";

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

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
      <PopoverContent className="w-auto p-0 border-0" align="start">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={emojiPickerTheme}
          width={350}
          height={400}
          searchPlaceHolder="Search emoji..."
          previewConfig={{ showPreview: false }}
        />
      </PopoverContent>
    </Popover>
  );
}
