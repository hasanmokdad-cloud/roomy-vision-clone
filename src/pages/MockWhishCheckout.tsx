import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, CreditCard, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentDetails {
  id: string;
  amount: number;
  currency: string;
  payment_type: string;
  status: string;
  raw_payload: {
    description?: string;
    metadata?: {
      roomName?: string;
      dormName?: string;
      planType?: string;
    };
  } | null;
}

export default function MockWhishCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const paymentId = searchParams.get('paymentId');
  
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayment = async () => {
      if (!paymentId) {
        setError('No payment ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Payment not found');

        setPayment(data as PaymentDetails);
      } catch (err) {
        console.error('Error loading payment:', err);
        setError('Failed to load payment details');
      } finally {
        setIsLoading(false);
      }
    };

    loadPayment();
  }, [paymentId]);

  const handleSimulateSuccess = async () => {
    if (!payment) return;
    setIsProcessing(true);

    try {
      // Update payment status to paid
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'succeeded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: 'Payment Successful',
        description: 'Redirecting back to Roomy...',
      });

      // Redirect to callback
      setTimeout(() => {
        navigate(`/payment/callback?paymentId=${payment.id}&status=success`);
      }, 1000);
    } catch (err) {
      console.error('Error simulating success:', err);
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const handleSimulateFailed = async () => {
    if (!payment) return;
    setIsProcessing(true);

    try {
      // Update payment status to failed
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: 'Payment Failed',
        description: 'Redirecting back to Roomy...',
        variant: 'destructive',
      });

      // Redirect to callback
      setTimeout(() => {
        navigate(`/payment/callback?paymentId=${payment.id}&status=failed`);
      }, 1000);
    } catch (err) {
      console.error('Error simulating failure:', err);
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || 'Payment not found'}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate(-1)} className="w-full">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isRoomDeposit = payment.payment_type === 'room_deposit';
  const description = payment.raw_payload?.description || 
    (isRoomDeposit ? 'Room Reservation Deposit' : 'AI Match Plan Upgrade');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4">
      <Card className="w-full max-w-md border-2 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          {/* Whish Logo Placeholder */}
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Secure Whish Payment</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1 mt-1">
              <Shield className="w-3 h-3" />
              Sandbox Environment
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sandbox Notice */}
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
              This is a <strong>sandbox simulation</strong> of the Whish payment page. No real charges will be made.
            </AlertDescription>
          </Alert>

          {/* Payment Details */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Description</span>
              <span className="font-medium text-right max-w-[60%]">{description}</span>
            </div>
            
            {payment.raw_payload?.metadata?.roomName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Room</span>
                <span className="font-medium">{payment.raw_payload.metadata.roomName}</span>
              </div>
            )}
            
            {payment.raw_payload?.metadata?.dormName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dorm</span>
                <span className="font-medium">{payment.raw_payload.metadata.dormName}</span>
              </div>
            )}
            
            {payment.raw_payload?.metadata?.planType && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className={`font-medium capitalize ${
                  payment.raw_payload.metadata.planType === 'vip' ? 'text-amber-500' : 'text-blue-500'
                }`}>
                  {payment.raw_payload.metadata.planType} Match
                </span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-primary">
                ${payment.amount.toFixed(2)} {payment.currency}
              </span>
            </div>
          </div>

          {/* Simulation Buttons */}
          <div className="space-y-2 pt-4">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Choose a simulation result:
            </p>
            
            <Button
              onClick={handleSimulateSuccess}
              disabled={isProcessing}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-5 h-5 mr-2" />
              )}
              Simulate Successful Payment
            </Button>

            <Button
              onClick={handleSimulateFailed}
              disabled={isProcessing}
              variant="destructive"
              className="w-full h-12"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <XCircle className="w-5 h-5 mr-2" />
              )}
              Simulate Failed Payment
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2 text-center">
          <p className="text-xs text-muted-foreground">
            Payment ID: {payment.id.slice(0, 8)}...
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by Whish (Sandbox)
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}