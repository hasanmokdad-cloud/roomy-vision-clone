import { ArrowLeft, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface WallpaperPickerProps {
  onBack: () => void;
  currentWallpaper: string;
  onSelect: (color: string) => void;
}

// WhatsApp-style color palette
const WALLPAPER_COLORS = [
  'default',
  '#efeae2', // WhatsApp default beige
  '#b1dfc4', // Light green
  '#a4d3ee', // Light blue
  '#c8b6e2', // Light purple
  '#f8c5c5', // Light pink
  '#fce4b3', // Light orange
  '#b8e0d2', // Mint
  '#d4edda', // Pale green
  '#cce5ff', // Pale blue
  '#e2d5f1', // Pale lavender
  '#ffe6e6', // Pale red
  '#fff3cd', // Pale yellow
  '#d1e7dd', // Success green
  '#f8d7da', // Danger pink
  '#d3d3d3', // Light gray
  '#a9a9a9', // Dark gray
  '#2e4057', // Navy
  '#048a81', // Teal
  '#54478c', // Indigo
  '#1a1a2e', // Dark blue
];

export function WallpaperPicker({ onBack, currentWallpaper, onSelect }: WallpaperPickerProps) {
  const [addDoodles, setAddDoodles] = useState(false);
  const [selectedColor, setSelectedColor] = useState(currentWallpaper);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onSelect(color);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-[60px] px-6 flex items-center gap-6 bg-[#f0f2f5] dark:bg-[#202c33]">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-[#54656f] dark:text-[#aebac1]" />
        </button>
        <h1 className="text-xl font-medium text-[#111b21] dark:text-[#e9edef]">Set chat wallpaper</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Add doodles checkbox */}
          <div className="flex items-center space-x-3 mb-6">
            <Checkbox
              id="doodles"
              checked={addDoodles}
              onCheckedChange={(checked) => setAddDoodles(checked as boolean)}
              className="w-5 h-5 border-2 data-[state=checked]:bg-[#00a884] data-[state=checked]:border-[#00a884]"
            />
            <label
              htmlFor="doodles"
              className="text-[15px] text-[#111b21] dark:text-[#e9edef] cursor-pointer"
            >
              Add Roomy doodles
            </label>
          </div>

          {/* Color grid */}
          <div className="grid grid-cols-4 gap-3">
            {WALLPAPER_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={cn(
                  "relative aspect-square rounded-lg border-2 transition-all",
                  selectedColor === color
                    ? "border-[#00a884] ring-2 ring-[#00a884]/20"
                    : "border-transparent hover:border-[#8696a0]/50",
                  color === 'default' && "bg-white dark:bg-[#0b141a]"
                )}
                style={{
                  backgroundColor: color === 'default' ? undefined : color,
                }}
              >
                {color === 'default' && (
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] text-[#667781] font-medium">
                    Default
                  </span>
                )}
                {selectedColor === color && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Preview section */}
          <div className="mt-6">
            <h3 className="text-[13px] font-medium text-[#00a884] uppercase tracking-wide mb-3">
              Preview
            </h3>
            <div
              className={cn(
                "h-40 rounded-lg border border-border relative overflow-hidden",
                selectedColor === 'default' && "bg-[#efeae2] dark:bg-[#0b141a]"
              )}
              style={{
                backgroundColor: selectedColor === 'default' ? undefined : selectedColor,
              }}
            >
              {/* Mock chat bubbles */}
              <div className="p-4 space-y-2">
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-[#202c33] rounded-lg px-3 py-2 max-w-[60%] shadow-sm">
                    <p className="text-[13px] text-[#111b21] dark:text-[#e9edef]">Hey there!</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#d9fdd3] dark:bg-[#005c4b] rounded-lg px-3 py-2 max-w-[60%] shadow-sm">
                    <p className="text-[13px] text-[#111b21] dark:text-[#e9edef]">Hello! 👋</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
