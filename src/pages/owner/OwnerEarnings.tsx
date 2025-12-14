import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { ArrowLeft, DollarSign, CreditCard } from 'lucide-react';
import { OwnerTableSkeleton } from '@/components/skeletons/OwnerSkeletons';
import { format } from 'date-fns';
import { AddWhishCardModal } from '@/components/payments/AddWhishCardModal';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OwnerBreadcrumb } from '@/components/owner/OwnerBreadcrumb';

export default function OwnerEarnings() {
  const navigate = useNavigate();
  const { userId } = useRoleGuard('owner');
  const [ownerId, setOwnerId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProfile, setPaymentProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
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

      const paid = reservationsData.filter(r => r.owner_payout_status === 'paid');
      const totalEarnings = paid.reduce((sum, r) => sum + (r.owner_payout_amount || 0), 0);

      setStats({
        totalEarnings,
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
    return <OwnerTableSkeleton />;
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8 space-y-8">
        <OwnerBreadcrumb items={[{ label: 'Earnings' }]} />
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" onClick={() => navigate('/owner')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Earnings</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track your reservation payouts and revenue
            </p>
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

        {/* Summary Card */}
        <div className="max-w-md">
          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Earnings
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
                      <td colSpan={5} className="text-center p-8 text-foreground/60">
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
    </OwnerLayout>
  );
}
