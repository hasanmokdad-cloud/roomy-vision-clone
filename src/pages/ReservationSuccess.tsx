import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home, MessageSquare, Calendar } from 'lucide-react';
import { Confetti } from '@/components/profile/Confetti';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ReservationSuccess() {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  
  const reservationId = searchParams.get('reservationId');

  useEffect(() => {
    if (!reservationId) {
      navigate('/reservation/failed');
      return;
    }

    const fetchReservation = async () => {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            rooms!inner(name, price, dorms!inner(dorm_name, name))
          `)
          .eq('id', reservationId)
          .single();

        if (error) throw error;

        if (data.status !== 'paid') {
          navigate('/reservation/failed?reservationId=' + reservationId);
          return;
        }

        setReservation(data);
      } catch (error) {
        console.error('Error fetching reservation:', error);
        navigate('/reservation/failed');
      }
    };

    fetchReservation();

    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [reservationId, navigate]);

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showConfetti && <Confetti />}
      {!isMobile && <RoomyNavbar />}
      
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-green-500/10 rounded-full p-4 w-fit">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl gradient-text">
              Reservation Confirmed!
            </CardTitle>
            <p className="text-muted-foreground">
              Your room has been successfully reserved
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Room Details */}
            <div className="glass-hover rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dorm</span>
                <span className="font-semibold text-right">
                  {reservation.rooms.dorms.dorm_name || reservation.rooms.dorms.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room</span>
                <span className="font-semibold">{reservation.rooms.name}</span>
              </div>
              {reservation.whish_payment_id && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="font-mono text-muted-foreground">
                    {reservation.whish_payment_id.slice(0, 16)}...
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Date</span>
                <span className="text-muted-foreground">
                  {new Date(reservation.paid_at || reservation.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="glass-hover rounded-xl p-4 space-y-3">
              <div className="flex justify-between font-semibold text-lg">
                <span>Deposit Paid</span>
                <span className="text-green-600">
                  ${(reservation.total_amount || reservation.deposit_amount * 1.10).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                This deposit secures your room. The remaining balance is due upon move-in.
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-sm text-foreground/80 text-center">
                📧 You'll receive a confirmation email with next steps shortly.
                <br />
                The dorm owner will be in touch soon!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/messages')}
                className="w-full"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </div>
            
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
