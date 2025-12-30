import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tv } from 'lucide-react';
import type { TVOption } from '@/types/amenities';

interface TVOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: TVOption;
  onSave: (option: TVOption) => void;
}

export function TVOptionsModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
}: TVOptionsModalProps) {
  const [optionType, setOptionType] = useState<'24/7' | 'other'>(initialValue?.type || '24/7');
  const [customSchedule, setCustomSchedule] = useState(initialValue?.customSchedule || '');

  const handleSave = () => {
    onSave({
      type: optionType,
      customSchedule: optionType === 'other' ? customSchedule : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-primary" />
            TV Availability
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={optionType} onValueChange={(v) => setOptionType(v as '24/7' | 'other')}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="24/7" id="tv-24-7" />
              <Label htmlFor="tv-24-7" className="flex-1 cursor-pointer font-medium">
                24/7 Available
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="other" id="tv-other" />
              <Label htmlFor="tv-other" className="flex-1 cursor-pointer font-medium">
                Other Schedule
              </Label>
            </div>
          </RadioGroup>

          {optionType === 'other' && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="custom-schedule">Specify TV availability</Label>
              <Input
                id="custom-schedule"
                placeholder="e.g. Common room TV, Cable included, etc."
                value={customSchedule}
                onChange={(e) => setCustomSchedule(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter details about TV access
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
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
