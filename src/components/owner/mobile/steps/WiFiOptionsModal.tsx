import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Wifi } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import type { WiFiOption } from '@/types/amenities';

interface WiFiOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: WiFiOption;
  onSave: (option: WiFiOption) => void;
  isSelected?: boolean;
  onRemove?: () => void;
}

export function WiFiOptionsModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
  isSelected,
  onRemove,
}: WiFiOptionsModalProps) {
  const [included, setIncluded] = useState<'yes' | 'no'>(initialValue?.included || 'yes');
  const [billingInfo, setBillingInfo] = useState(initialValue?.billingInfo || '');

  useEffect(() => {
    if (initialValue) {
      setIncluded(initialValue.included || 'yes');
      setBillingInfo(initialValue.billingInfo || '');
    }
  }, [initialValue, open]);

  const handleSave = () => {
    onSave({
      included,
      billingInfo: included === 'no' ? billingInfo : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-primary" />
            WiFi Service
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Configure WiFi service options</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Is WiFi included in the monthly rent?
          </p>
          
          <RadioGroup value={included} onValueChange={(v) => setIncluded(v as 'yes' | 'no')}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="yes" id="wifi-included" />
              <Label htmlFor="wifi-included" className="flex-1 cursor-pointer">
                <span className="font-medium">Included in rent</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  WiFi access with no extra charges
                </p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="no" id="wifi-not-included" />
              <Label htmlFor="wifi-not-included" className="flex-1 cursor-pointer">
                <span className="font-medium">Not included</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Students pay a separate subscription fee
                </p>
              </Label>
            </div>
          </RadioGroup>

          {included === 'no' && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="billing-info">How are students charged?</Label>
              <Textarea
                id="billing-info"
                placeholder="e.g., $20/month subscription fee for fiber connection"
                value={billingInfo}
                onChange={(e) => setBillingInfo(e.target.value)}
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Help students understand WiFi costs
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
