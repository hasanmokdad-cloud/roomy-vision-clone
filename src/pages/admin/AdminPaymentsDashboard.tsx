import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/shared/Navbar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export default function AdminPaymentsDashboard() {
  const navigate = useNavigate();
  const { loading: authLoading, userId } = useAuthGuard();
  const { role, loading: roleLoading } = useRoleGuard();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Revenue stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    roomyCommission: 0,
    ownerPayouts: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    if (!authLoading && !roleLoading && userId && role === 'admin') {
      loadPaymentData();
    }
  }, [authLoading, roleLoading, userId, role]);

  const loadPaymentData = async () => {
    try {
      // Load all payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      setPayments(paymentsData || []);

      // Load all reservations
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select(`
          *,
          students (user_id, full_name),
          rooms (name, type),
          dorms (name)
        `)
        .order('created_at', { ascending: false });

      setReservations(reservationsData || []);

      // Calculate stats
      if (reservationsData) {
        const totalRevenue = reservationsData
          .filter(r => r.status === 'paid')
          .reduce((sum, r) => sum + (r.total_amount || 0), 0);

        const roomyCommission = reservationsData
          .filter(r => r.status === 'paid')
          .reduce((sum, r) => sum + (r.commission_amount || 0), 0);

        const ownerPayouts = reservationsData
          .filter(r => r.status === 'paid')
          .reduce((sum, r) => sum + (r.owner_payout_amount || r.deposit_amount || 0), 0);

        const pendingPayments = reservationsData
          .filter(r => r.status === 'pending_payment')
          .reduce((sum, r) => sum + (r.total_amount || 0), 0);

        setStats({
          totalRevenue,
          roomyCommission,
          ownerPayouts,
          pendingPayments,
        });
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending_payment':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'expired':
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-32 max-w-6xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (role !== 'admin') {
    navigate('/unauthorized');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      <div className="container mx-auto px-6 py-32 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-2 gradient-text">Payments Dashboard</h1>
          <p className="text-muted-foreground mb-8">
            Monitor all platform payments, commissions, and payouts
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Roomy Commission</span>
              </div>
              <p className="text-3xl font-bold text-primary">
                ${stats.roomyCommission.toFixed(2)}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Owner Payouts</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                ${stats.ownerPayouts.toFixed(2)}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">
                ${stats.pendingPayments.toFixed(2)}
              </p>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending_payment">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reservations List */}
          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No payment records found</p>
              </Card>
            ) : (
              filteredReservations.map((reservation) => (
                <Card key={reservation.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">
                        {reservation.rooms?.name} ({reservation.rooms?.type})
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {reservation.dorms?.name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(reservation.created_at).toLocaleDateString()}
                        </div>
                        <span>
                          Student: {reservation.students?.full_name || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="border-t pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Deposit</span>
                      <span className="font-medium">${reservation.deposit_amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Commission (10%)</span>
                      <span className="font-medium text-primary">${reservation.commission_amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Owner Payout</span>
                      <span className="font-medium">${reservation.owner_payout_amount || reservation.deposit_amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total</span>
                      <span className="font-bold">${reservation.total_amount}</span>
                    </div>
                  </div>

                  {reservation.whish_payment_id && (
                    <div className="border-t mt-4 pt-4">
                      <p className="text-xs text-muted-foreground">
                        Whish Payment ID: {reservation.whish_payment_id}
                      </p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
