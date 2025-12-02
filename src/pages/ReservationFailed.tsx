import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, RotateCw, Search } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { toast } from '@/hooks/use-toast';

export default function ReservationFailed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pendingReservation, setPendingReservation] = useState<any>(null);
  const [isResuming, setIsResuming] = useState(false);
  
  const reservationId = searchParams.get('reservationId');
  const reason = searchParams.get('reason') || 'Payment could not be processed';

  useEffect(() => {
    const checkPendingReservation = async () => {
      if (!reservationId) return;

      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            rooms!inner(name, dorms!inner(dorm_name))
          `)
          .eq('id', reservationId)
          .single();

        if (!error && data.status === 'pending_payment' && data.whish_checkout_url) {
          // Check if not expired
          if (!data.expires_at || new Date(data.expires_at) > new Date()) {
            setPendingReservation(data);
          }
        }
      } catch (error) {
        console.error('Error checking pending reservation:', error);
      }
    };

    checkPendingReservation();
  }, [reservationId]);

  const handleResumePayment = () => {
    if (pendingReservation?.whish_checkout_url) {
      setIsResuming(true);
      window.location.href = pendingReservation.whish_checkout_url;
    }
  };

  const handleRetryNewPayment = () => {
    if (pendingReservation?.rooms) {
      // Navigate back to listings to try again
      toast({
        title: 'Please try booking again',
        description: 'Select the room to create a new reservation',
      });
      navigate('/listings');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-xl border-destructive/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-destructive/10 rounded-full p-4 w-fit">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Payment Failed
              </span>
            </CardTitle>
            <p className="text-muted-foreground">
              Your reservation was not completed
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Reason */}
            <div className="glass-hover rounded-xl p-4 border border-destructive/20">
              <p className="text-sm text-center text-muted-foreground">
                <span className="font-semibold text-destructive">Reason:</span> {reason}
              </p>
            </div>

            {/* Pending Reservation Info */}
            {pendingReservation && (
              <div className="glass-hover rounded-xl p-4 space-y-2">
                <p className="font-semibold text-sm">Incomplete Reservation:</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dorm</span>
                    <span>{pendingReservation.rooms.dorms.dorm_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room</span>
                    <span>{pendingReservation.rooms.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">
                      ${(pendingReservation.total_amount || pendingReservation.deposit_amount * 1.10).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {pendingReservation ? (
                <Button
                  onClick={handleResumePayment}
                  disabled={isResuming}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                >
                  <RotateCw className={`w-4 h-4 mr-2 ${isResuming ? 'animate-spin' : ''}`} />
                  Resume Payment
                </Button>
              ) : (
                <Button
                  onClick={handleRetryNewPayment}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Retry Payment
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => navigate('/listings')}
                className="w-full"
              >
                <Search className="w-4 h-4 mr-2" />
                Return to Rooms
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Help Text */}
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-center text-muted-foreground">
                If you continue to experience issues, please contact support.
                <br />
                Your payment was not processed and you were not charged.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
