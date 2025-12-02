import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';

export default function PendingReservationBanner() {
  const [pendingReservation, setPendingReservation] = useState<any>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getSession();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const checkPendingReservation = async () => {
      try {
        // Get student ID
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!student) return;

        // Check for pending reservation
        const { data: reservation } = await supabase
          .from('reservations')
          .select(`
            *,
            rooms!inner(name, dorms!inner(dorm_name))
          `)
          .eq('student_id', student.id)
          .eq('status', 'pending_payment')
          .maybeSingle();

        if (reservation && reservation.whish_checkout_url) {
          // Check if not expired
          if (!reservation.expires_at || new Date(reservation.expires_at) > new Date()) {
            setPendingReservation(reservation);
          } else {
            // Expired - update status
            await supabase
              .from('reservations')
              .update({ status: 'expired' })
              .eq('id', reservation.id);
          }
        }
      } catch (error) {
        console.error('Error checking pending reservation:', error);
      }
    };

    checkPendingReservation();
  }, [userId]);

  const handleResumePayment = () => {
    if (pendingReservation?.whish_checkout_url) {
      window.location.href = pendingReservation.whish_checkout_url;
    }
  };

  if (!pendingReservation || isHidden) return null;

  return (
    <Alert className="mb-4 border-orange-500/50 bg-orange-500/10">
      <AlertCircle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-foreground">Incomplete Payment</p>
          <p className="text-sm text-muted-foreground">
            You have a pending payment for {pendingReservation.rooms.name} at{' '}
            {pendingReservation.rooms.dorms.dorm_name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleResumePayment}
            className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shrink-0"
          >
            Resume Payment
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsHidden(true)}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
