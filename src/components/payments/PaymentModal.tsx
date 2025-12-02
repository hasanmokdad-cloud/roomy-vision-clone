import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Home, Sparkles, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PaymentMode = 'room_deposit' | 'ai_match_plan';

export interface PaymentMetadata {
  roomId?: string;
  dormId?: string;
  dormName?: string;
  roomName?: string;
  monthlyPrice?: number;
  ownerId?: string;
  studentId?: string;
  planType?: 'advanced' | 'vip';
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PaymentMode;
  amount: number;
  currency?: string;
  description: string;
  metadata: PaymentMetadata;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  mode,
  amount,
  currency = 'USD',
  description,
  metadata,
  onSuccess,
  onCancel,
}: PaymentModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPaymentProfile, setHasPaymentProfile] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Check if user has payment profile on mount
  useEffect(() => {
    const checkPaymentProfile = async () => {
      if (!open) return;
      
      setIsCheckingProfile(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasPaymentProfile(false);
          return;
        }

        const { data } = await supabase
          .from('user_payment_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        setHasPaymentProfile(!!data);
      } catch (error) {
        console.error('Error checking payment profile:', error);
        setHasPaymentProfile(false);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkPaymentProfile();
  }, [open]);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Call edge function to create mock payment session
      const { data, error } = await supabase.functions.invoke('create-mock-payment-session', {
        body: {
          mode,
          amount,
          currency,
          description,
          metadata,
        },
      });

      if (error) throw error;

      const { paymentId, hostedUrl } = data;

      // Navigate to mock Whish checkout
      window.location.href = hostedUrl;
    } catch (error) {
      console.error('Error creating payment session:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    onCancel();
  };

  const isRoomDeposit = mode === 'room_deposit';
  const Icon = isRoomDeposit ? Home : Sparkles;
  const title = isRoomDeposit ? 'Confirm Reservation Payment' : 'Confirm Plan Upgrade';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isRoomDeposit 
                ? 'bg-primary/10' 
                : 'bg-gradient-to-br from-amber-400/20 to-orange-500/20'
            }`}>
              <Icon className={`w-5 h-5 ${isRoomDeposit ? 'text-primary' : 'text-amber-500'}`} />
            </div>
            {title}
          </DialogTitle>
          <DialogDescription>
            {isRoomDeposit 
              ? 'Review your reservation details before proceeding to payment'
              : 'Upgrade your AI Match plan to unlock more features'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Preview Mode Alert */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Sandbox Mode:</strong> This is a simulated payment flow for testing.
          </AlertDescription>
        </Alert>

        {/* Payment Summary Card */}
        <Card className="border-2">
          <CardContent className="p-4 space-y-3">
            {isRoomDeposit ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Room</span>
                  <span className="font-medium">{metadata.roomName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dorm</span>
                  <span className="font-medium">{metadata.dormName}</span>
                </div>
                {metadata.monthlyPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Price</span>
                    <span className="font-medium">${metadata.monthlyPrice.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit to secure your spot</span>
                  <span className="font-semibold text-primary">${amount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selected Plan</span>
                  <span className={`font-semibold capitalize ${
                    metadata.planType === 'vip' ? 'text-amber-500' : 'text-blue-500'
                  }`}>
                    {metadata.planType} Match
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan Type</span>
                  <span className="font-medium">One-time purchase</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan Price</span>
                  <span className="font-semibold text-primary">${amount.toFixed(2)}</span>
                </div>
              </>
            )}

            {/* Total */}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  ${amount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Section */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment Method</p>
          {isCheckingProfile ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking payment info...
            </div>
          ) : hasPaymentProfile ? (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="text-sm">Whish Payment •••• (saved)</span>
              </div>
              <Button variant="link" size="sm" className="text-xs h-auto p-0">
                Manage
              </Button>
            </div>
          ) : (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertDescription className="text-sm">
                Please add your payment information in Settings before proceeding.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !hasPaymentProfile || isCheckingProfile}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Pay with Whish
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}