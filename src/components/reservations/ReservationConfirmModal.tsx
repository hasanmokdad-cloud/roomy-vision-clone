import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { calculateTotalDue } from '@/lib/payments/config';
import { PaymentModal } from '@/components/payments/PaymentModal';
import { useToast } from '@/hooks/use-toast';

interface ReservationConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: {
    id?: string;
    name: string;
    price: number;
  };
  dormId?: string;
  dormName: string;
  ownerId?: string;
  depositAmount: number;
}

export function ReservationConfirmModal({
  open,
  onOpenChange,
  room,
  dormId,
  dormName,
  ownerId,
  depositAmount,
}: ReservationConfirmModalProps) {
  const { toast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Calculate total (deposit + 10% fee) - this is what students pay
  const { total } = calculateTotalDue(depositAmount);

  const handleContinueToPayment = () => {
    if (!room.id) {
      toast({
        title: 'Error',
        description: 'Room information is incomplete',
        variant: 'destructive',
      });
      return;
    }
    
    onOpenChange(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    toast({
      title: 'Processing...',
      description: 'Your payment is being processed.',
    });
    setShowPaymentModal(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  return (
    <>
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

          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Sandbox Mode:</strong> This is a simulated payment flow for testing.
            </AlertDescription>
          </Alert>

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

            {/* Show only total deposit - hide internal breakdown */}
            <div className="flex justify-between">
              <span className="font-bold text-lg">Deposit to Secure</span>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                ${total.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              This deposit secures your room. The remaining balance is due upon move-in.
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinueToPayment}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Continue to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        mode="room_deposit"
        amount={total}
        description={`Reservation deposit for ${room.name} at ${dormName}`}
        metadata={{
          roomId: room.id,
          dormId,
          dormName,
          roomName: room.name,
          monthlyPrice: room.price,
          ownerId,
        }}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    </>
  );
}
