import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { OwnerTableSkeleton } from '@/components/skeletons/OwnerSkeletons';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function AdminEarnings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCommission: 0,
    pendingCommission: 0,
    ownerPayoutsCompleted: 0,
  });
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    // Fetch all reservations with room/dorm/student/owner details
    const { data: reservationsData } = await supabase
      .from('reservations')
      .select(`
        *,
        rooms!inner(
          name,
          dorms!inner(
            dorm_name,
            name,
            owner_id,
            owners!inner(full_name)
          )
        ),
        students!inner(full_name)
      `)
      .order('created_at', { ascending: false });

    if (reservationsData) {
      setReservations(reservationsData);

      // Calculate stats
      const paidReservations = reservationsData.filter(r => r.status === 'paid');
      const totalCommission = paidReservations.reduce((sum, r) => sum + (r.commission_amount || 0), 0);
      
      const pendingPaymentReservations = reservationsData.filter(r => 
        r.status === 'pending' || r.status === 'processing'
      );
      const pendingCommission = pendingPaymentReservations.reduce((sum, r) => sum + (r.commission_amount || 0), 0);
      
      const ownerPayoutsCompleted = paidReservations
        .filter(r => r.owner_payout_status === 'paid')
        .reduce((sum, r) => sum + (r.owner_payout_amount || 0), 0);

      setStats({
        totalCommission,
        pendingCommission,
        ownerPayoutsCompleted,
      });
    }

    setLoading(false);
  };

  const getPaymentStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      paid: { color: 'bg-green-500', label: 'Paid' },
      pending: { color: 'bg-amber-500', label: 'Pending' },
      failed: { color: 'bg-red-500', label: 'Failed' },
      processing: { color: 'bg-blue-500', label: 'Processing' },
    };

    const config = configs[status] || { color: 'bg-gray-500', label: status || 'Unknown' };

    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getPayoutStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      paid: { color: 'bg-green-500', label: 'Paid' },
      pending: { color: 'bg-amber-500', label: 'Scheduled' },
      failed: { color: 'bg-red-500', label: 'Failed' },
      not_scheduled: { color: 'bg-gray-500', label: 'Not Scheduled' },
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
      <AdminLayout>
        <OwnerTableSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Earnings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Admin Earnings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track platform commissions and owner payouts
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Commission (Captured)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${stats.totalCommission.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From paid reservations
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Owner Payouts (Completed)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ${stats.ownerPayoutsCompleted.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully paid to owners
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                ${stats.pendingCommission.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting payment completion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reservations Table */}
        <Card className="glass-hover">
          <CardHeader>
            <CardTitle>All Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left p-4 font-semibold">Room</th>
                    <th className="text-left p-4 font-semibold">Dorm</th>
                    <th className="text-left p-4 font-semibold">Owner</th>
                    <th className="text-left p-4 font-semibold">Student</th>
                    <th className="text-right p-4 font-semibold">Deposit</th>
                    <th className="text-right p-4 font-semibold">Roomy Fee</th>
                    <th className="text-right p-4 font-semibold">Owner Payout</th>
                    <th className="text-center p-4 font-semibold">Payment</th>
                    <th className="text-center p-4 font-semibold">Payout Status</th>
                    <th className="text-center p-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="p-4 font-medium">
                        {reservation.rooms?.name}
                      </td>
                      <td className="p-4">
                        {reservation.rooms?.dorms?.dorm_name || reservation.rooms?.dorms?.name}
                      </td>
                      <td className="p-4">
                        {reservation.rooms?.dorms?.owners?.full_name || '—'}
                      </td>
                      <td className="p-4">{reservation.students?.full_name}</td>
                      <td className="text-right p-4">${reservation.deposit_amount?.toFixed(2)}</td>
                      <td className="text-right p-4 text-orange-600">
                        ${reservation.commission_amount?.toFixed(2)}
                      </td>
                      <td className="text-right p-4 text-green-600">
                        ${reservation.owner_payout_amount?.toFixed(2) || reservation.deposit_amount?.toFixed(2)}
                      </td>
                      <td className="text-center p-4">
                        {getPaymentStatusBadge(reservation.status)}
                      </td>
                      <td className="text-center p-4">
                        {getPayoutStatusBadge(reservation.owner_payout_status || 'not_scheduled')}
                      </td>
                      <td className="text-center p-4">
                        {reservation.created_at
                          ? format(new Date(reservation.created_at), 'PP')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center p-8 text-muted-foreground">
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
    </AdminLayout>
  );
}
