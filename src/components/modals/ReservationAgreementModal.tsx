import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface ReservationAgreementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
}

export function ReservationAgreementModal({
  open,
  onOpenChange,
  onAgree,
}: ReservationAgreementModalProps) {
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (agreed) {
      setAgreed(false);
      onAgree();
    }
  };

  const handleClose = () => {
    setAgreed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Before You Reserve
          </DialogTitle>
          <DialogDescription>
            Please read and acknowledge the following
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-foreground">
            By reserving this room, you understand and agree that:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
            <li>Deposits are non-refundable.</li>
            <li>Roomy is only a listing platform and is not a party to the rental agreement.</li>
            <li>Payments and disputes must be resolved directly with the dorm owner.</li>
          </ul>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
          <Checkbox
            id="reservation-agreement"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="reservation-agreement"
            className="text-sm text-foreground leading-tight cursor-pointer"
          >
            I understand and agree
          </Label>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!agreed}
            className="w-full sm:w-auto"
          >
            Continue to Reserve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
