import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ThemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTheme: 'light' | 'dark' | 'system';
  onSelect: (theme: 'light' | 'dark' | 'system') => void;
}

export function ThemeModal({ open, onOpenChange, currentTheme, onSelect }: ThemeModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(currentTheme);

  // Sync local state with prop when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTheme(currentTheme);
    }
  }, [open, currentTheme]);

  const handleConfirm = () => {
    onSelect(selectedTheme);
  };

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System default' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] p-0 gap-0 bg-background border-border">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-[20px] font-medium text-[#111b21] dark:text-[#e9edef]">
            Theme
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-2">
          <RadioGroup
            value={selectedTheme}
            onValueChange={(value) => setSelectedTheme(value as 'light' | 'dark' | 'system')}
            className="space-y-1"
          >
            {themeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 py-3">
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className={cn(
                    "w-5 h-5 border-2",
                    selectedTheme === option.value
                      ? "border-[#00a884] text-[#00a884]"
                      : "border-[#8696a0]"
                  )}
                />
                <Label
                  htmlFor={option.value}
                  className="text-[17px] text-[#111b21] dark:text-[#e9edef] cursor-pointer flex-1"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="px-6 py-4 flex-row justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-[#00a884] hover:text-[#00a884] hover:bg-[#00a884]/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-[#00a884] hover:bg-[#00a884]/90 text-white"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
