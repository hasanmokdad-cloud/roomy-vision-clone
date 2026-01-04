import { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { WaterOption } from '@/types/amenities';

interface WaterOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: WaterOption;
  onSave: (option: WaterOption) => void;
}

export function WaterOptionsModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
}: WaterOptionsModalProps) {
  const [waterType, setWaterType] = useState<'sweet' | 'salty'>(
    initialValue?.waterType || 'sweet'
  );
  const [hotWater, setHotWater] = useState<'24/7' | 'other'>(
    initialValue?.hotWater || '24/7'
  );
  const [hotWaterDetails, setHotWaterDetails] = useState(
    initialValue?.hotWaterDetails || ''
  );

  useEffect(() => {
    if (initialValue) {
      setWaterType(initialValue.waterType);
      setHotWater(initialValue.hotWater);
      setHotWaterDetails(initialValue.hotWaterDetails || '');
    }
  }, [initialValue]);

  const handleSave = () => {
    const option: WaterOption = {
      waterType,
      hotWater,
      ...(hotWater === 'other' && hotWaterDetails ? { hotWaterDetails } : {}),
    };
    onSave(option);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            Water Options
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Water Type Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Water Type</Label>
            <RadioGroup
              value={waterType}
              onValueChange={(v) => setWaterType(v as 'sweet' | 'salty')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="sweet" id="water-sweet" />
                <Label htmlFor="water-sweet" className="flex-1 cursor-pointer">
                  <span className="font-medium">Sweet Water</span>
                  <p className="text-sm text-muted-foreground">Fresh, drinkable water supply</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="salty" id="water-salty" />
                <Label htmlFor="water-salty" className="flex-1 cursor-pointer">
                  <span className="font-medium">Salty Water</span>
                  <p className="text-sm text-muted-foreground">Non-drinkable (common in coastal areas)</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Hot Water Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Hot Water Availability</Label>
            <RadioGroup
              value={hotWater}
              onValueChange={(v) => setHotWater(v as '24/7' | 'other')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="24/7" id="hot-247" />
                <Label htmlFor="hot-247" className="flex-1 cursor-pointer">
                  <span className="font-medium">Hot Water 24/7</span>
                  <p className="text-sm text-muted-foreground">Continuous hot water availability</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="other" id="hot-other" />
                <Label htmlFor="hot-other" className="flex-1 cursor-pointer">
                  <span className="font-medium">Other</span>
                  <p className="text-sm text-muted-foreground">Custom schedule or electrical heater</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Conditional Details Field */}
          {hotWater === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="hot-water-details" className="text-sm font-medium">
                Hot Water Details
              </Label>
              <Textarea
                id="hot-water-details"
                placeholder="e.g., 'Hot water available 6 AM - 10 PM' or 'Room has electrical water heater (may increase electricity bill)'"
                value={hotWaterDetails}
                onChange={(e) => setHotWaterDetails(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
