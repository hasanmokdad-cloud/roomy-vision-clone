import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet, CreditCard, TrendingUp, ArrowLeft, Plus, Trash2, RefreshCw, History, DollarSign, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { CardBrandIcon } from '@/components/payments/CardBrandIcons';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface AdminCard {
  id: string;
  card_last4: string;
  card_brand: string;
  card_country: string;
  exp_month: number;
  exp_year: number;
}

interface CommissionRecord {
  id: string;
  reservation_id: string;
  student_id: string;
  owner_id: string;
  commission_amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function AdminFinanceHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: roleLoading } = useRoleGuard('admin');
  
  const [loading, setLoading] = useState(true);
  
  // Earnings state
  const [earningsStats, setEarningsStats] = useState({ totalCommission: 0, ownerPayoutsCompleted: 0 });
  const [reservations, setReservations] = useState<any[]>([]);
  
  // Wallet state
  const [adminCard, setAdminCard] = useState<AdminCard | null>(null);
  const [balance, setBalance] = useState(0);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [recentCommissions, setRecentCommissions] = useState<CommissionRecord[]>([]);

  useEffect(() => {
    if (!roleLoading) {
      loadAllData();
    }
  }, [roleLoading]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadEarningsData(),
      loadWalletData(),
    ]);
    setLoading(false);
  };

  const loadEarningsData = async () => {
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
      const paidReservations = reservationsData.filter(r => r.status === 'paid');
      const totalCommission = paidReservations.reduce((sum, r) => sum + (r.commission_amount || 0), 0);
      const ownerPayoutsCompleted = paidReservations
        .filter(r => r.owner_payout_status === 'paid')
        .reduce((sum, r) => sum + (r.owner_payout_amount || 0), 0);
      setEarningsStats({ totalCommission, ownerPayoutsCompleted });
    }
  };

  const loadWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: walletData } = await supabase
        .from('admin_wallet')
        .select('*')
        .eq('admin_id', user.id)
        .single();

      if (walletData) {
        setAdminCard({
          id: walletData.id,
          card_last4: walletData.card_last4 || '',
          card_brand: walletData.card_brand || 'visa',
          card_country: walletData.card_country || 'Lebanon',
          exp_month: walletData.exp_month || 0,
          exp_year: walletData.exp_year || 0,
        });
        setBalance(walletData.balance || 0);
      }

      const { data: totalData } = await supabase
        .from('admin_income_history')
        .select('commission_amount');
      
      const total = totalData?.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0) || 0;
      setTotalCommissions(total);

      const { data: recentData } = await supabase
        .from('admin_income_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentCommissions(recentData || []);
    } catch (error) {
      console.error('Error loading admin wallet:', error);
    }
  };

  const handleRemoveCard = async () => {
    if (!adminCard) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('admin_wallet')
        .delete()
        .eq('admin_id', user.id);

      if (error) throw error;

      setAdminCard(null);
      toast({ title: 'Card Removed', description: 'Your payout card has been removed.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      paid: { color: 'bg-green-500', label: 'Paid' },
      pending: { color: 'bg-amber-500', label: 'Pending' },
      failed: { color: 'bg-red-500', label: 'Failed' },
      processing: { color: 'bg-blue-500', label: 'Processing' },
    };
    const config = configs[status] || { color: 'bg-gray-500', label: status || 'Unknown' };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const getPayoutStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      paid: { color: 'bg-green-500', label: 'Paid' },
      failed: { color: 'bg-red-500', label: 'Failed' },
      not_scheduled: { color: 'bg-gray-500', label: 'Not Scheduled' },
      processing: { color: 'bg-blue-500', label: 'Processing' },
    };
    const config = configs[status] || configs.not_scheduled;
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'captured':
      case 'completed': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Captured</Badge>;
      case 'failed': return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (roleLoading || loading) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Finance Hub</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  Finance Hub
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Platform commission and wallet management
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadAllData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Commission (Captured)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">${earningsStats.totalCommission.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">From paid reservations</p>
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
                <div className="text-3xl font-bold text-blue-600">${earningsStats.ownerPayoutsCompleted.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Successfully paid to owners</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Wallet Card */}
          <Card className="bg-gradient-to-br from-primary/20 via-purple-500/15 to-teal-500/20 border-white/20 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-white/80 dark:bg-black/50 backdrop-blur-lg m-1 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-foreground/70">
                      <Wallet className="w-5 h-5" />
                      <span className="font-medium">Admin Wallet</span>
                    </div>
                    <div className="text-5xl font-black bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">
                      ${totalCommissions.toFixed(2)}
                    </div>
                    <p className="text-sm text-foreground/60">Total Commissions Earned</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payout Method */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payout Method (Whish Card)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {adminCard && adminCard.card_last4 ? (
                <div className="space-y-4">
                  <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl max-w-md">
                    <div className="absolute top-4 right-4">
                      <CardBrandIcon brand={adminCard.card_brand} />
                    </div>
                    <div className="space-y-6">
                      <div className="text-lg tracking-widest font-mono">
                        •••• •••• •••• {adminCard.card_last4}
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-gray-400">EXPIRES</p>
                          <p className="font-mono">{String(adminCard.exp_month).padStart(2, '0')}/{adminCard.exp_year}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">COUNTRY</p>
                          <p className="text-sm">{adminCard.card_country}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate('/mock-whish-admin-add-card')}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Change Card
                    </Button>
                    <Button variant="destructive" size="icon" onClick={handleRemoveCard}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">No Payout Card Added</h3>
                    <p className="text-foreground/60 text-sm">Set up your Whish account to receive commission payouts</p>
                  </div>
                  <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={() => navigate('/mock-whish-admin-add-card')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payout Card
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Commissions Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Recent Commission Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCommissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reservation</TableHead>
                        <TableHead>Commission (10%)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentCommissions.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-foreground/70">{format(new Date(record.created_at), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-mono text-sm">{record.reservation_id?.slice(0, 8)}...</TableCell>
                          <TableCell className="font-semibold text-green-600">${Number(record.commission_amount).toFixed(2)}</TableCell>
                          <TableCell>{getCommissionStatusBadge(record.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-foreground/60">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No commission payouts yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Reservations Table */}
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
                      <th className="text-left p-4 font-semibold">Owner</th>
                      <th className="text-left p-4 font-semibold">Student</th>
                      <th className="text-right p-4 font-semibold">Deposit</th>
                      <th className="text-right p-4 font-semibold">Roomy Fee</th>
                      <th className="text-center p-4 font-semibold">Payment</th>
                      <th className="text-center p-4 font-semibold">Payout</th>
                      <th className="text-center p-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.slice(0, 20).map((reservation) => (
                      <tr key={reservation.id} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="p-4 font-medium">{reservation.rooms?.name}</td>
                        <td className="p-4">{reservation.rooms?.dorms?.owners?.full_name || '—'}</td>
                        <td className="p-4">{reservation.students?.full_name}</td>
                        <td className="text-right p-4">${reservation.deposit_amount?.toFixed(2)}</td>
                        <td className="text-right p-4 text-orange-600">${reservation.commission_amount?.toFixed(2)}</td>
                        <td className="text-center p-4">{getPaymentStatusBadge(reservation.status)}</td>
                        <td className="text-center p-4">{getPayoutStatusBadge(reservation.owner_payout_status || 'not_scheduled')}</td>
                        <td className="text-center p-4">{reservation.created_at ? format(new Date(reservation.created_at), 'PP') : '—'}</td>
                      </tr>
                    ))}
                    {reservations.length === 0 && (
                      <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">No reservations yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
