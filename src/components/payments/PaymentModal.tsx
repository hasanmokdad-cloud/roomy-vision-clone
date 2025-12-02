import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Home, Sparkles, AlertTriangle, Loader2, ExternalLink, Plus } from 'lucide-react';
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

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  is_default: boolean;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [defaultCard, setDefaultCard] = useState<PaymentMethod | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Check if user has payment methods on mount
  useEffect(() => {
    const checkPaymentMethods = async () => {
      if (!open) return;
      
      setIsCheckingProfile(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPaymentMethods([]);
          return;
        }

        // Get student ID
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!student) {
          setPaymentMethods([]);
          return;
        }

        setStudentId(student.id);

        // Get payment methods
        const { data: methods } = await supabase
          .from('payment_methods')
          .select('id, last4, brand, is_default')
          .eq('student_id', student.id)
          .order('is_default', { ascending: false });

        setPaymentMethods(methods || []);
        
        // Find default card
        const defaultMethod = methods?.find(m => m.is_default) || methods?.[0] || null;
        setDefaultCard(defaultMethod);
      } catch (error) {
        console.error('Error checking payment methods:', error);
        setPaymentMethods([]);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkPaymentMethods();
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
          metadata: {
            ...metadata,
            paymentMethodId: defaultCard?.id,
            last4: defaultCard?.last4,
          },
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

  const handleAddCard = () => {
    if (!studentId) return;
    onOpenChange(false);
    navigate(`/mock-whish-add-card?studentId=${studentId}`);
  };

  const handleManageCards = () => {
    onOpenChange(false);
    navigate('/wallet');
  };

  const handleCancel = () => {
    onOpenChange(false);
    onCancel();
  };

  const isRoomDeposit = mode === 'room_deposit';
  const Icon = isRoomDeposit ? Home : Sparkles;
  const title = isRoomDeposit ? 'Confirm Reservation Payment' : 'Confirm Plan Upgrade';
  const hasPaymentMethod = paymentMethods.length > 0;

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
              Checking saved cards...
            </div>
          ) : hasPaymentMethod && defaultCard ? (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">
                  {defaultCard.brand} Visa •••• {defaultCard.last4}
                </span>
              </div>
              <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={handleManageCards}>
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Alert className="border-primary/50 bg-primary/5">
                <CreditCard className="w-4 h-4 text-primary" />
                <AlertDescription className="text-sm">
                  Add a Whish card to proceed with payment.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddCard}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Whish Card
              </Button>
            </div>
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
            disabled={isProcessing || !hasPaymentMethod || isCheckingProfile}
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