import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { ArrowLeft, DollarSign, Clock, TrendingUp, Loader2, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { AddWhishCardModal } from '@/components/payments/AddWhishCardModal';

export default function OwnerEarnings() {
  const navigate = useNavigate();
  const { userId } = useRoleGuard('owner');
  const [ownerId, setOwnerId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProfile, setPaymentProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    upcomingPayouts: 0,
    platformFees: 0,
  });
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      loadOwnerId();
    }
  }, [userId]);

  useEffect(() => {
    if (ownerId) {
      loadEarningsData();
      loadPaymentProfile();
    }
  }, [ownerId]);

  const loadPaymentProfile = async () => {
    if (!userId) return;
    
    const { data } = await supabase
      .from('user_payment_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    setPaymentProfile(data);
  };

  const loadOwnerId = async () => {
    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (owner) {
      setOwnerId(owner.id);
    }
  };

  const loadEarningsData = async () => {
    if (!ownerId) return;

    // Get all reservations for owner's dorms
    const { data: reservationsData } = await supabase
      .from('reservations')
      .select(`
        *,
        rooms!inner(
          name,
          dorms!inner(
            dorm_name,
            name,
            owner_id
          )
        ),
        students!inner(full_name)
      `)
      .eq('rooms.dorms.owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (reservationsData) {
      setReservations(reservationsData);

      // Calculate stats
      const paid = reservationsData.filter(r => r.owner_payout_status === 'paid');
      const pending = reservationsData.filter(r => 
        r.owner_payout_status === 'pending' || r.owner_payout_status === 'failed'
      );

      const totalEarnings = paid.reduce((sum, r) => sum + (r.owner_payout_amount || 0), 0);
      const upcomingPayouts = pending.reduce((sum, r) => sum + (r.owner_payout_amount || 0), 0);
      const platformFees = reservationsData.reduce((sum, r) => sum + (r.commission_amount || 0), 0);

      setStats({
        totalEarnings,
        upcomingPayouts,
        platformFees,
      });
    }

    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      paid: { color: 'bg-green-500', label: 'Paid' },
      pending: { color: 'bg-amber-500', label: 'Scheduled' },
      failed: { color: 'bg-red-500', label: 'Failed (will retry)' },
      not_scheduled: { color: 'bg-gray-500', label: 'Awaiting payment' },
      processing: { color: 'bg-blue-500', label: 'Processing' },
    };

    const config = configs[status] || configs.not_scheduled;

    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/owner')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Earnings</h1>
              <p className="text-foreground/60 mt-2">
                Track your reservation payouts and revenue
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowPaymentModal(true)}
            className="hidden md:flex"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {paymentProfile ? 'Update Payment Info' : 'Add Payment Info'}
          </Button>
        </div>

        {/* Mobile payment button */}
        <Button
          variant="outline"
          onClick={() => setShowPaymentModal(true)}
          className="w-full md:hidden"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {paymentProfile ? 'Update Payment Info' : 'Add Payment Info'}
        </Button>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Earnings (Paid)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${stats.totalEarnings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed payouts
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Upcoming Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                ${stats.upcomingPayouts.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending or scheduled
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Platform Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                ${stats.platformFees.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total Roomy fees (10%)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reservations Table */}
        <Card className="glass-hover">
          <CardHeader>
            <CardTitle>Reservation Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left p-4 font-semibold">Room</th>
                    <th className="text-left p-4 font-semibold">Student</th>
                    <th className="text-right p-4 font-semibold">Deposit</th>
                    <th className="text-right p-4 font-semibold">Roomy Fee</th>
                    <th className="text-right p-4 font-semibold">Total Paid</th>
                    <th className="text-right p-4 font-semibold">Your Payout</th>
                    <th className="text-center p-4 font-semibold">Status</th>
                    <th className="text-center p-4 font-semibold">Payout Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{reservation.rooms?.name}</div>
                          <div className="text-sm text-foreground/60">
                            {reservation.rooms?.dorms?.dorm_name || reservation.rooms?.dorms?.name}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{reservation.students?.full_name}</td>
                      <td className="text-right p-4">${reservation.deposit_amount?.toFixed(2)}</td>
                      <td className="text-right p-4 text-orange-600">
                        ${reservation.commission_amount?.toFixed(2)}
                      </td>
                      <td className="text-right p-4 font-semibold">
                        ${reservation.total_amount?.toFixed(2)}
                      </td>
                      <td className="text-right p-4 font-semibold text-green-600">
                        ${reservation.owner_payout_amount?.toFixed(2) || reservation.deposit_amount?.toFixed(2)}
                      </td>
                      <td className="text-center p-4">
                        {getStatusBadge(reservation.owner_payout_status || 'not_scheduled')}
                      </td>
                      <td className="text-center p-4">
                        {reservation.owner_payout_timestamp
                          ? format(new Date(reservation.owner_payout_timestamp), 'PP')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-foreground/60">
                        No reservations yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      <AddWhishCardModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSuccess={loadPaymentProfile}
      />
    </div>
  );
}
