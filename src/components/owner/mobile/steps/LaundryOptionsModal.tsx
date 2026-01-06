import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { WashingMachine } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import type { LaundryOption } from '@/types/amenities';

interface LaundryOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: LaundryOption;
  onSave: (option: LaundryOption) => void;
  isSelected?: boolean;
  onRemove?: () => void;
}

export function LaundryOptionsModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
  isSelected,
  onRemove,
}: LaundryOptionsModalProps) {
  const [washingMachine, setWashingMachine] = useState(initialValue?.washingMachine ?? true);
  const [dryingMachine, setDryingMachine] = useState(initialValue?.dryingMachine ?? false);
  const [billing, setBilling] = useState<'included' | 'per-use'>(initialValue?.billing || 'included');
  const [washingCost, setWashingCost] = useState(initialValue?.washingCost || '');
  const [dryingCost, setDryingCost] = useState(initialValue?.dryingCost || '');

  useEffect(() => {
    if (initialValue) {
      setWashingMachine(initialValue.washingMachine ?? true);
      setDryingMachine(initialValue.dryingMachine ?? false);
      setBilling(initialValue.billing || 'included');
      setWashingCost(initialValue.washingCost || '');
      setDryingCost(initialValue.dryingCost || '');
    }
  }, [initialValue, open]);

  const handleSave = () => {
    onSave({
      washingMachine,
      dryingMachine,
      billing,
      washingCost: billing === 'per-use' && washingMachine ? washingCost : undefined,
      dryingCost: billing === 'per-use' && dryingMachine ? dryingCost : undefined,
    });
    onOpenChange(false);
  };

  const hasMachineSelected = washingMachine || dryingMachine;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WashingMachine className="w-5 h-5 text-primary" />
            Laundry Options
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Configure laundry options</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Machine Types Section */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              What laundry machines are available?
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Select all that apply
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                <Checkbox
                  id="washing-machine"
                  checked={washingMachine}
                  onCheckedChange={(checked) => setWashingMachine(checked === true)}
                />
                <Label htmlFor="washing-machine" className="flex-1 cursor-pointer">
                  <span className="font-medium">Washing Machine</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    For washing clothes
                  </p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                <Checkbox
                  id="drying-machine"
                  checked={dryingMachine}
                  onCheckedChange={(checked) => setDryingMachine(checked === true)}
                />
                <Label htmlFor="drying-machine" className="flex-1 cursor-pointer">
                  <span className="font-medium">Drying Machine</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    For drying clothes
                  </p>
                </Label>
              </div>
            </div>
          </div>

          {/* Billing Section - Only show if at least one machine is selected */}
          {hasMachineSelected && (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">
                How is laundry billed?
              </p>
              
              <RadioGroup value={billing} onValueChange={(v) => setBilling(v as 'included' | 'per-use')}>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="included" id="laundry-included" />
                  <Label htmlFor="laundry-included" className="flex-1 cursor-pointer">
                    <span className="font-medium">Included in rent</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Students can use freely
                    </p>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="per-use" id="laundry-per-use" />
                  <Label htmlFor="laundry-per-use" className="flex-1 cursor-pointer">
                    <span className="font-medium">Pay per use</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Students pay for each use
                    </p>
                  </Label>
                </div>
              </RadioGroup>

              {/* Per-use cost fields */}
              {billing === 'per-use' && (
                <div className="mt-4 space-y-4">
                  {washingMachine && (
                    <div className="space-y-2">
                      <Label htmlFor="washing-cost">Washing machine cost per use</Label>
                      <Input
                        id="washing-cost"
                        placeholder="e.g., $3 per load"
                        value={washingCost}
                        onChange={(e) => setWashingCost(e.target.value)}
                      />
                    </div>
                  )}
                  
                  {dryingMachine && (
                    <div className="space-y-2">
                      <Label htmlFor="drying-cost">Drying machine cost per use</Label>
                      <Input
                        id="drying-cost"
                        placeholder="e.g., $2 per load"
                        value={dryingCost}
                        onChange={(e) => setDryingCost(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
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
          <Button 
            onClick={handleSave} 
            disabled={!hasMachineSelected}
            className="bg-[#00a884] hover:bg-[#00a884]/90"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
