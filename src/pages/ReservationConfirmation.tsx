import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Loader2, Home } from 'lucide-react';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';

export default function ReservationConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [reservation, setReservation] = useState<any>(null);
  
  const reservationId = searchParams.get('reservationId');

  useEffect(() => {
    if (!reservationId) {
      setStatus('failed');
      return;
    }

    const checkReservationStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            rooms!inner(name, price, dorms!inner(dorm_name))
          `)
          .eq('id', reservationId)
          .single();

        if (error) throw error;

        setReservation(data);

        if (data.status === 'paid') {
          setStatus('success');
        } else if (data.status === 'cancelled' || data.status === 'expired') {
          setStatus('failed');
        } else {
          // Still pending, keep checking
          setTimeout(checkReservationStatus, 3000);
        }
      } catch (error) {
        console.error('Error checking reservation status:', error);
        setStatus('failed');
      }
    };

    checkReservationStatus();
  }, [reservationId]);

  return (
    <div className="min-h-screen flex flex-col">
      <RoomyNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {status === 'pending' && 'Confirming Your Payment...'}
              {status === 'success' && 'Reservation Confirmed!'}
              {status === 'failed' && 'Reservation Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              {status === 'pending' && (
                <>
                  <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground text-center">
                    We're confirming your payment with our payment provider.
                    <br />
                    This usually takes just a few seconds...
                  </p>
                </>
              )}
              
              {status === 'success' && reservation && (
                <>
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-lg font-semibold mb-4">
                    Your reservation has been confirmed!
                  </p>
                  <div className="w-full bg-muted rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dorm</span>
                      <span className="font-medium">{reservation.rooms.dorms.dorm_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room</span>
                      <span className="font-medium">{reservation.rooms.name}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room Deposit</span>
                      <span className="font-medium">
                        ${reservation.deposit_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commission (10%)</span>
                      <span className="font-medium">
                        ${(reservation.commission_amount || reservation.deposit_amount * 0.10).toFixed(2)}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span className="text-foreground">Total Paid</span>
                      <span className="text-green-600">
                        ${(reservation.total_amount || reservation.deposit_amount * 1.10).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    You'll receive a confirmation email shortly with next steps.
                  </p>
                </>
              )}
              
              {status === 'failed' && (
                <>
                  <XCircle className="w-16 h-16 text-destructive mb-4" />
                  <p className="text-lg font-semibold mb-2">
                    Payment could not be processed
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Your reservation was not completed. Please try again or contact support if the issue persists.
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {status === 'success' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/saved-rooms')}
                    className="flex-1"
                  >
                    View Saved Rooms
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </>
              )}
              
              {status === 'failed' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/listings')}
                    className="flex-1"
                  >
                    Browse Rooms
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    Go Home
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

