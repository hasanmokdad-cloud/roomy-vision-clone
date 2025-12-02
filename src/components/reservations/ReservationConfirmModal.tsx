import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createReservationCheckout, isWhishConfigured } from '@/lib/payments/whishClient';
import { calculateTotalDue } from '@/lib/payments/config';
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
  
  const { deposit, commission, total } = calculateTotalDue(depositAmount);
  const isPreviewMode = !isWhishConfigured();

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

        {isPreviewMode && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Preview Mode:</strong> Real payments will activate once Whish API keys are configured.
            </AlertDescription>
          </Alert>
        )}

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
              <span className="font-medium">${room.price?.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Room Deposit</span>
              <span className="font-medium">${deposit.toFixed(2)}</span>
            </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Roomy Fee (10%)</span>
            <span className="font-medium">${commission.toFixed(2)}</span>
          </div>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="font-bold text-lg">Total Due Today</span>
            <span className="text-xl font-bold text-primary">
              ${total.toFixed(2)}
            </span>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Payment Breakdown</p>
                <p>This includes the room deposit plus our 10% commission.</p>
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
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Payment...
              </span>
            ) : isPreviewMode ? (
              'Continue (Preview)'
            ) : (
              `Pay $${total.toFixed(2)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
