import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Zap } from 'lucide-react';
import type { ElectricityOption } from '@/types/amenities';

interface ElectricityOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: ElectricityOption;
  onSave: (option: ElectricityOption) => void;
}

export function ElectricityOptionsModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
}: ElectricityOptionsModalProps) {
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
            <Zap className="w-5 h-5 text-primary" />
            Electricity Availability
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={optionType} onValueChange={(v) => setOptionType(v as '24/7' | 'other')}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="24/7" id="elec-24-7" />
              <Label htmlFor="elec-24-7" className="flex-1 cursor-pointer font-medium">
                24/7 Electricity
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="other" id="elec-other" />
              <Label htmlFor="elec-other" className="flex-1 cursor-pointer font-medium">
                Other Schedule
              </Label>
            </div>
          </RadioGroup>

          {optionType === 'other' && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="custom-schedule">Specify electricity hours</Label>
              <Input
                id="custom-schedule"
                placeholder="e.g. From 6 AM till 8 AM then 12 PM till 2 PM; 6 PM till 2 AM"
                value={customSchedule}
                onChange={(e) => setCustomSchedule(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the hours when electricity is available
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
