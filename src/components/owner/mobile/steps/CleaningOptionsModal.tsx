import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import type { CleaningOption } from '@/types/amenities';

interface CleaningOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: CleaningOption;
  onSave: (option: CleaningOption) => void;
  isSelected?: boolean;
  onRemove?: () => void;
}

export function CleaningOptionsModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
  isSelected,
  onRemove,
}: CleaningOptionsModalProps) {
  const [frequency, setFrequency] = useState<CleaningOption['frequency']>(initialValue?.frequency || 'once');
  const [customSchedule, setCustomSchedule] = useState(initialValue?.customSchedule || '');

  useEffect(() => {
    if (initialValue) {
      setFrequency(initialValue.frequency || 'once');
      setCustomSchedule(initialValue.customSchedule || '');
    }
  }, [initialValue, open]);

  const handleSave = () => {
    onSave({
      frequency,
      customSchedule: frequency === 'other' ? customSchedule : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Cleaning Service Frequency
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Configure cleaning service frequency</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as CleaningOption['frequency'])}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="once" id="clean-once" />
              <Label htmlFor="clean-once" className="flex-1 cursor-pointer font-medium">
                Once per week
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="twice" id="clean-twice" />
              <Label htmlFor="clean-twice" className="flex-1 cursor-pointer font-medium">
                Twice per week
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="three" id="clean-three" />
              <Label htmlFor="clean-three" className="flex-1 cursor-pointer font-medium">
                Three times per week
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="other" id="clean-other" />
              <Label htmlFor="clean-other" className="flex-1 cursor-pointer font-medium">
                Other
              </Label>
            </div>
          </RadioGroup>

          {frequency === 'other' && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="custom-schedule">Specify cleaning schedule</Label>
              <Input
                id="custom-schedule"
                placeholder="e.g. Once per 2 weeks, once per month..."
                value={customSchedule}
                onChange={(e) => setCustomSchedule(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter your custom cleaning service schedule
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {isSelected && onRemove && (
            <Button variant="ghost" onClick={onRemove} className="text-destructive hover:text-destructive mr-auto">
              Remove
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#00a884] hover:bg-[#00a884]/90">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
