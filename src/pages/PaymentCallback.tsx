import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Home, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendReservationWelcomeMessage } from '@/lib/reservationNotifications';

interface PaymentData {
  id: string;
  payment_type: string;
  status: string;
  amount: number;
  student_id: string;
  reservation_id: string | null;
  match_plan_type: string | null;
  raw_payload: {
    metadata?: {
      roomId?: string;
      dormId?: string;
      planType?: string;
    };
  } | null;
}

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const paymentId = searchParams.get('paymentId');
  const status = searchParams.get('status');
  
  const [isProcessing, setIsProcessing] = useState(true);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processComplete, setProcessComplete] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const handleContinue = useCallback(() => {
    if (!payment) {
      navigate('/');
      return;
    }

    if (status === 'success') {
      if (payment.payment_type === 'room_deposit') {
        navigate(`/reservation/success?reservationId=${payment.reservation_id}`);
      } else {
        navigate('/ai-match');
      }
    } else {
      if (payment.payment_type === 'room_deposit') {
        navigate('/reservation/failed');
      } else {
        navigate('/ai-match');
      }
    }
  }, [payment, status, navigate]);

  // Auto-redirect countdown
  useEffect(() => {
    if (!processComplete || isProcessing) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [processComplete, isProcessing, handleContinue]);

  useEffect(() => {
    const processPaymentCallback = async () => {
      if (!paymentId || !status) {
        setError('Invalid callback parameters');
        setIsProcessing(false);
        return;
      }

      try {
        // Load payment details
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (paymentError) throw paymentError;
        if (!paymentData) throw new Error('Payment not found');

        setPayment(paymentData as PaymentData);

        if (status === 'success') {
          await handleSuccessfulPayment(paymentData as PaymentData);
        } else {
          // Payment failed - no additional processing needed
          setProcessComplete(true);
        }
      } catch (err) {
        console.error('Error processing callback:', err);
        setError('Failed to process payment callback');
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentCallback();
  }, [paymentId, status]);

  const handleSuccessfulPayment = async (paymentData: PaymentData) => {
    const metadata = paymentData.raw_payload?.metadata;

    // Get student info for billing history
    const { data: { user } } = await supabase.auth.getUser();
    let studentId: string | null = null;
    let defaultCard: { last4: string } | null = null;

    if (user) {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (student) {
        studentId = student.id;

        // Get default payment method
        const { data: card } = await supabase
          .from('payment_methods')
          .select('last4')
          .eq('student_id', student.id)
          .eq('is_default', true)
          .single();
        
        defaultCard = card;
      }
    }

    if (paymentData.payment_type === 'room_deposit' && metadata?.roomId) {
      // Handle room reservation success
      try {
        // Update reservation status if exists
        if (paymentData.reservation_id) {
          await supabase
            .from('reservations')
            .update({ 
              status: 'paid',
              paid_at: new Date().toISOString(),
            })
            .eq('id', paymentData.reservation_id);
        }

        // Increment room occupancy
        await supabase.rpc('increment_room_occupancy', { room_id: metadata.roomId });

        // Get room and dorm details including owner
        const { data: room } = await supabase
          .from('rooms')
          .select('id, name, dorm_id, deposit, price')
          .eq('id', metadata.roomId)
          .single();

        let dormName = 'Room';
        let ownerId: string | null = null;

        if (metadata.dormId) {
          const { data: dorm } = await supabase
            .from('dorms')
            .select('name, owner_id')
            .eq('id', metadata.dormId)
            .single();
          if (dorm) {
            dormName = dorm.name;
            ownerId = dorm.owner_id;
          }
        }

        // Update student's current dorm and room
        if (user && studentId) {
          await supabase
            .from('students')
            .update({
              current_dorm_id: metadata.dormId,
              current_room_id: metadata.roomId,
              accommodation_status: 'have_dorm',
            })
            .eq('id', studentId);

          // Insert billing history record
          await supabase.from('billing_history').insert({
            student_id: studentId,
            payment_id: paymentData.id,
            amount: paymentData.amount,
            currency: 'USD',
            type: 'room_reservation',
            description: `Room Reservation at ${dormName}`,
            payment_method_last4: defaultCard?.last4 || null,
          });

          // Create payout history for owner (deposit splits)
          if (ownerId && room) {
            const baseDeposit = room.deposit || room.price || paymentData.amount / 1.10;
            const roomyFee = baseDeposit * 0.10;
            const ownerReceives = baseDeposit * 0.90;

            await supabase.from('payout_history').insert({
              owner_id: ownerId,
              student_id: studentId,
              room_id: metadata.roomId,
              dorm_id: metadata.dormId,
              deposit_amount: baseDeposit,
              roomy_fee: roomyFee,
              owner_receives: ownerReceives,
              currency: 'USD',
              payment_id: paymentData.id,
              reservation_id: paymentData.reservation_id,
              status: 'paid',
            });

            // Mock payout trigger (placeholder for real Whish API)
            console.log('Mock payout triggered:', { ownerReceives, ownerId });
          }

          // Send automatic welcome message to owner
          if (metadata.dormId) {
            await sendReservationWelcomeMessage(user.id, metadata.dormId, metadata.roomId);
          }
        }

        toast({
          title: 'Reservation Confirmed!',
          description: 'Your room has been successfully reserved.',
        });
      } catch (err) {
        console.error('Error processing room reservation:', err);
      }
    } else if (paymentData.payment_type === 'match_plan' && metadata?.planType) {
      // Handle AI Match plan upgrade
      try {
        if (user && studentId) {
          // Update student's ai_match_plan
          await supabase
            .from('students')
            .update({ ai_match_plan: metadata.planType })
            .eq('id', studentId);

          // Create or update student_match_plans record
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

          await supabase
            .from('student_match_plans')
            .upsert({
              student_id: studentId,
              plan_type: metadata.planType,
              status: 'active',
              expires_at: expiresAt.toISOString(),
            }, {
              onConflict: 'student_id',
            });

          // Insert billing history record
          await supabase.from('billing_history').insert({
            student_id: studentId,
            payment_id: paymentData.id,
            amount: paymentData.amount,
            currency: 'USD',
            type: 'ai_match',
            description: `AI Match — ${metadata.planType.charAt(0).toUpperCase() + metadata.planType.slice(1)} Plan`,
            payment_method_last4: defaultCard?.last4 || null,
          });
        }

        toast({
          title: 'Plan Upgraded!',
          description: `Your ${metadata.planType} plan is now active.`,
        });
      } catch (err) {
        console.error('Error activating match plan:', err);
      }
    }

    setProcessComplete(true);
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Processing your payment...</p>
          <p className="text-sm text-muted-foreground">Please wait, do not close this page.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isSuccess = status === 'success';
  const isRoomDeposit = payment?.payment_type === 'room_deposit';
  const Icon = isRoomDeposit ? Home : Sparkles;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            isSuccess 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' 
              : 'bg-destructive/10'
          }`}>
            {isSuccess ? (
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            ) : (
              <XCircle className="w-10 h-10 text-destructive" />
            )}
          </div>
          <CardTitle className={isSuccess ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </CardTitle>
          <CardDescription>
            {isSuccess 
              ? isRoomDeposit 
                ? 'Your room reservation has been confirmed.'
                : 'Your AI Match plan has been activated.'
              : 'Your payment could not be processed. Please try again.'
            }
          </CardDescription>
        </CardHeader>

        {payment && (
          <CardContent>
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono text-xs">{payment.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">${payment.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-semibold ${isSuccess ? 'text-green-500' : 'text-destructive'}`}>
                  {isSuccess ? 'Completed' : 'Failed'}
                </span>
              </div>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex-col gap-2">
          <Button 
            onClick={handleContinue} 
            className={`w-full ${isSuccess ? 'bg-gradient-to-r from-primary to-purple-600' : ''}`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {isSuccess 
              ? isRoomDeposit ? 'View Reservation' : 'Go to AI Match'
              : 'Try Again'
            }
          </Button>
          
          {/* Countdown indicator */}
          <p className="text-sm text-muted-foreground text-center">
            Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
          
          {!isSuccess && (
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
