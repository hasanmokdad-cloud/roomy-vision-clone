import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UtensilsCrossed } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import type { KitchenOption } from '@/types/amenities';

interface KitchenOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: KitchenOption;
  onSave: (option: KitchenOption) => void;
  isSelected?: boolean;
  onRemove?: () => void;
}

export function KitchenOptionsModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
  isSelected,
  onRemove,
}: KitchenOptionsModalProps) {
  const [billing, setBilling] = useState<'included' | 'not-included'>(initialValue?.billing || 'included');
  const [billingInfo, setBillingInfo] = useState(initialValue?.billingInfo || '');

  useEffect(() => {
    if (initialValue) {
      setBilling(initialValue.billing || 'included');
      setBillingInfo(initialValue.billingInfo || '');
    }
  }, [initialValue, open]);

  const handleSave = () => {
    onSave({ billing, ...(billing === 'not-included' ? { billingInfo } : {}) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
            Kitchen Details
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Configure kitchen options</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              Is the kitchen included in the monthly rent?
            </p>
            
            <RadioGroup value={billing} onValueChange={(v) => setBilling(v as 'included' | 'not-included')}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="included" id="kitchen-included" />
                <Label htmlFor="kitchen-included" className="flex-1 cursor-pointer">
                  <span className="font-medium">Included in rent</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kitchen access with no extra charges
                  </p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="not-included" id="kitchen-not-included" />
                <Label htmlFor="kitchen-not-included" className="flex-1 cursor-pointer">
                  <span className="font-medium">Not included</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Students pay separately
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {billing === 'not-included' && (
              <div className="mt-4 pl-1">
                <Label htmlFor="kitchen-billing-info" className="text-sm font-medium text-foreground">
                  Specify the arrangement
                </Label>
                <Input
                  id="kitchen-billing-info"
                  value={billingInfo}
                  onChange={(e) => setBillingInfo(e.target.value)}
                  placeholder="e.g. Pay per use, $10/month subscription, tokens required…"
                  className="mt-1.5"
                />
              </div>
            )}
          </div>
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
            className="bg-[#00a884] hover:bg-[#00a884]/90"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
