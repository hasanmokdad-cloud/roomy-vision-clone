import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Zap } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import type { ElectricityOption } from '@/types/amenities';

interface ElectricityOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: ElectricityOption;
  onSave: (option: ElectricityOption) => void;
  isSelected?: boolean;
  onRemove?: () => void;
}

export function ElectricityOptionsModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
  isSelected,
  onRemove,
}: ElectricityOptionsModalProps) {
  const [availability, setAvailability] = useState<'24/7' | 'limited'>(initialValue?.availability || '24/7');
  const [availabilityDetails, setAvailabilityDetails] = useState(initialValue?.availabilityDetails || '');
  const [included, setIncluded] = useState<'yes' | 'no'>(initialValue?.included || 'yes');
  const [billingInfo, setBillingInfo] = useState(initialValue?.billingInfo || '');

  useEffect(() => {
    if (initialValue) {
      setAvailability(initialValue.availability || '24/7');
      setAvailabilityDetails(initialValue.availabilityDetails || '');
      setIncluded(initialValue.included || 'yes');
      setBillingInfo(initialValue.billingInfo || '');
    }
  }, [initialValue, open]);

  const handleSave = () => {
    onSave({
      availability,
      availabilityDetails: availability === 'limited' ? availabilityDetails : undefined,
      included,
      billingInfo: included === 'no' ? billingInfo : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Electricity Options
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Configure electricity options</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Availability Section */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              Is electricity available 24/7?
            </p>
            
            <RadioGroup value={availability} onValueChange={(v) => setAvailability(v as '24/7' | 'limited')}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="24/7" id="elec-247" />
                <Label htmlFor="elec-247" className="flex-1 cursor-pointer">
                  <span className="font-medium">Yes, 24/7 electricity</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uninterrupted power supply
                  </p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="limited" id="elec-limited" />
                <Label htmlFor="elec-limited" className="flex-1 cursor-pointer">
                  <span className="font-medium">Limited hours</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Electricity available during specific hours
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {availability === 'limited' && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="availability-details">Electricity schedule</Label>
                <Textarea
                  id="availability-details"
                  placeholder="e.g., 6 AM - 12 AM daily, or generator backup during outages"
                  value={availabilityDetails}
                  onChange={(e) => setAvailabilityDetails(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            )}
          </div>

          {/* Billing Section */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              Is electricity included in rent?
            </p>
            
            <RadioGroup value={included} onValueChange={(v) => setIncluded(v as 'yes' | 'no')}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="yes" id="elec-included" />
                <Label htmlFor="elec-included" className="flex-1 cursor-pointer">
                  <span className="font-medium">Included in rent</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No extra charges for electricity
                  </p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="no" id="elec-not-included" />
                <Label htmlFor="elec-not-included" className="flex-1 cursor-pointer">
                  <span className="font-medium">Not included</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Students pay separately for electricity
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {included === 'no' && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="billing-info">How are students charged?</Label>
                <Textarea
                  id="billing-info"
                  placeholder="e.g., Charged per kWh based on monthly meter reading. Average cost: $30-50/month."
                  value={billingInfo}
                  onChange={(e) => setBillingInfo(e.target.value)}
                  className="min-h-[60px]"
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
          <Button onClick={handleSave} className="bg-[#00a884] hover:bg-[#00a884]/90">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
