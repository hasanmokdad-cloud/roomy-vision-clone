import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Home, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { createReservationCheckout } from '@/lib/payments/whishClient';
import { RESERVATION_FEE_PERCENT } from '@/lib/payments/config';
import { useToast } from '@/hooks/use-toast';

interface ReservationConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: {
    id?: string;
    name: string;
    price: number;
  };
  dormName: string;
  depositAmount: number;
}

export function ReservationConfirmModal({
  open,
  onOpenChange,
  room,
  dormName,
  depositAmount,
}: ReservationConfirmModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const reservationFee = depositAmount * RESERVATION_FEE_PERCENT;

  const handleConfirm = async () => {
    if (!room.id) {
      toast({
        title: 'Error',
        description: 'Room information is incomplete',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { checkoutUrl } = await createReservationCheckout({
        roomId: room.id,
        depositAmount,
      });

      // Redirect to Whish checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating reservation checkout:', error);
      toast({
        title: 'Error',
        description: 'Failed to create checkout session. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            Confirm Reservation
          </DialogTitle>
          <DialogDescription>
            Review your reservation details before proceeding to payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Room</span>
              <span className="font-medium">{room.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dorm</span>
              <span className="font-medium">{dormName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Price</span>
              <span className="font-medium">${room.price.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Full Deposit (per bed)</span>
              <span className="font-medium">${depositAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Reservation Fee (10%)</span>
              <span className="text-lg font-bold text-primary">
                ${reservationFee.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 space-y-2">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Important Information</p>
                <p>You are paying only <strong>10% of the deposit</strong> to secure your spot.</p>
                <p className="mt-1">Each roommate pays their own deposit share.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? 'Processing...' : `Pay $${reservationFee.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
