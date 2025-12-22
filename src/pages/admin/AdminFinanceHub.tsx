import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet, CreditCard, TrendingUp, ArrowLeft, Plus, Trash2, RefreshCw, History, DollarSign, AlertCircle, Clock, CheckCircle, XCircle, User, Building2, Zap, RefreshCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { CardBrandIcon } from '@/components/payments/CardBrandIcons';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { OwnerTableSkeleton } from '@/components/skeletons/OwnerSkeletons';

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

interface RefundRequest {
  id: string;
  reservation_id: string;
  student_id: string;
  owner_id: string;
  reason: string;
  status: string;
  created_at: string;
  processed_at?: string;
  rejection_note?: string;
  owner_decision?: string;
  owner_decision_note?: string;
  admin_decision?: string;
  admin_decision_note?: string;
  base_deposit?: number;
  total_paid?: number;
  refund_owner_amount?: number;
  refund_admin_amount?: number;
  reservations?: {
    total_amount: number;
    deposit_amount: number;
    commission_amount: number;
    rooms?: { name: string; type: string };
    dorms?: { name: string };
  };
  students?: { full_name: string; profile_photo_url?: string };
  owners?: { full_name: string };
}

export default function AdminFinanceHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { loading: roleLoading } = useRoleGuard('admin');
  
  const [loading, setLoading] = useState(true);
  const activeTab = searchParams.get('tab') || 'earnings';
  
  // Earnings state
  const [earningsStats, setEarningsStats] = useState({ totalCommission: 0, ownerPayoutsCompleted: 0 });
  const [reservations, setReservations] = useState<any[]>([]);
  
  // Wallet state
  const [adminCard, setAdminCard] = useState<AdminCard | null>(null);
  const [balance, setBalance] = useState(0);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [recentCommissions, setRecentCommissions] = useState<CommissionRecord[]>([]);
  
  // Refunds state
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [refundFilter, setRefundFilter] = useState<string>('pending');
  const [refundStats, setRefundStats] = useState({
    pendingOwner: 0, pendingAdmin: 0, refunded: 0, rejected: 0, totalRefunded: 0,
  });
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!roleLoading) {
      loadAllData();
    }
  }, [roleLoading]);

  useEffect(() => {
    if (!loading) {
      loadRefundRequests();
    }
  }, [refundFilter]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadEarningsData(),
      loadWalletData(),
      loadRefundRequests(),
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

  const loadRefundRequests = async () => {
    try {
      let query = supabase
        .from('refund_requests')
        .select(`
          *,
          reservations (
            total_amount, deposit_amount, commission_amount,
            rooms (name, type),
            dorms (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (refundFilter === 'pending') {
        query = query.in('status', ['pending', 'pending_owner', 'pending_admin', 'approved']);
      } else if (refundFilter !== 'all') {
        query = query.eq('status', refundFilter);
      }

      const { data } = await query;

      const enrichedData = await Promise.all((data || []).map(async (request) => {
        const [studentResult, ownerResult] = await Promise.all([
          supabase.from('students').select('full_name, profile_photo_url').eq('id', request.student_id).maybeSingle(),
          supabase.from('owners').select('full_name').eq('id', request.owner_id).maybeSingle()
        ]);
        return { ...request, students: studentResult.data, owners: ownerResult.data };
      }));

      setRefundRequests(enrichedData as RefundRequest[]);

      const { data: allRequests } = await supabase
        .from('refund_requests')
        .select('status, total_paid, reservations(total_amount)');

      const requests = allRequests || [];
      setRefundStats({
        pendingOwner: requests.filter(r => r.status === 'pending' || r.status === 'pending_owner').length,
        pendingAdmin: requests.filter(r => r.status === 'pending_admin' || r.status === 'approved').length,
        refunded: requests.filter(r => r.status === 'refunded' || r.status === 'processed').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        totalRefunded: requests
          .filter(r => r.status === 'refunded' || r.status === 'processed')
          .reduce((sum, r: any) => sum + (r.total_paid || r.reservations?.total_amount || 0), 0),
      });
    } catch (error) {
      console.error('Error loading refund requests:', error);
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

  const handleApproveAndProcess = async (request: RefundRequest) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('refund_requests').update({ status: 'approved', admin_decision: 'approved' }).eq('id', request.id);
      await supabase.from('reservations').update({ latest_refund_status: 'approved' }).eq('id', request.reservation_id);

      const { error } = await supabase.functions.invoke('whish-refund-handler', {
        body: { reservation_id: request.reservation_id, refund_request_id: request.id, initiated_by: user.id },
      });

      if (error) throw error;

      toast({ title: 'Refund Processed', description: `Refund of $${request.total_paid || request.reservations?.total_amount} has been processed successfully.` });
      loadRefundRequests();
    } catch (error: any) {
      await supabase.from('refund_requests').update({ status: 'failed' }).eq('id', request.id);
      await supabase.from('reservations').update({ latest_refund_status: 'failed' }).eq('id', request.reservation_id);
      toast({ title: 'Error', description: error.message || 'Failed to process refund', variant: 'destructive' });
      loadRefundRequests();
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionNote.trim()) return;

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('refund_requests').update({
        status: 'rejected',
        rejection_note: rejectionNote.trim(),
        processed_at: new Date().toISOString(),
        processed_by: user?.id,
        admin_decision: 'rejected',
        admin_decision_note: rejectionNote.trim(),
        admin_id: user?.id,
      }).eq('id', selectedRequest.id);

      await supabase.from('reservations').update({ latest_refund_status: 'rejected' }).eq('id', selectedRequest.reservation_id);

      toast({ title: 'Refund Rejected', description: 'The refund request has been rejected.' });

      setShowRejectModal(false);
      setRejectionNote('');
      setSelectedRequest(null);
      loadRefundRequests();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject refund request', variant: 'destructive' });
    } finally {
      setProcessing(false);
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
      pending: { color: 'bg-amber-500', label: 'Scheduled' },
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
      case 'pending': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'failed': return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRefundStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_owner': return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300">Pending Owner</Badge>;
      case 'pending_admin': return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">Pending Admin</Badge>;
      case 'approved': return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">Approved (Processing)</Badge>;
      case 'refunded':
      case 'processed': return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">Refunded</Badge>;
      case 'rejected': return <Badge className="bg-red-500/20 text-red-700 dark:text-red-300">Rejected</Badge>;
      case 'failed': return <Badge className="bg-red-500/20 text-red-700 dark:text-red-300">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canProcess = (status: string) => ['pending', 'pending_owner', 'pending_admin', 'approved'].includes(status);
  const isOverride = (status: string) => status === 'pending' || status === 'pending_owner';

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
                  Platform earnings, wallet, and refund management
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadAllData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="earnings" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="wallet" className="gap-2">
                <Wallet className="h-4 w-4" />
                Wallet
              </TabsTrigger>
              <TabsTrigger value="refunds" className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Refunds
              </TabsTrigger>
            </TabsList>

            {/* EARNINGS TAB */}
            <TabsContent value="earnings" className="space-y-6 mt-6">
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
            </TabsContent>

            {/* WALLET TAB */}
            <TabsContent value="wallet" className="space-y-6 mt-6">
              {/* Balance Summary Card */}
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
                          ${balance.toFixed(2)}
                        </div>
                        <p className="text-sm text-foreground/60">Current Balance</p>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-green-500/10">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-foreground/60">Total Commissions Earned</p>
                            <p className="text-xl font-bold text-green-600">${totalCommissions.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Linked Whish Card */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Payout Method (Whish Card)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adminCard && adminCard.card_last4 ? (
                      <div className="space-y-4">
                        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl">
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
                          <Button variant="outline" className="flex-1" onClick={() => navigate('/mock-whish-admin-add-card')}>
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

                {/* Quick Stats */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Commission Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-foreground/60">Captured</p>
                        <p className="text-2xl font-bold text-green-600">
                          {recentCommissions.filter(c => c.status === 'captured').length}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm text-foreground/60">Pending</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {recentCommissions.filter(c => c.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/admin/billing')}>
                      <History className="w-4 h-4 mr-2" />
                      View Full Billing History
                    </Button>
                  </CardContent>
                </Card>
              </div>

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
            </TabsContent>

            {/* REFUNDS TAB */}
            <TabsContent value="refunds" className="space-y-6 mt-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                    <p className="text-2xl font-bold">{refundStats.pendingOwner}</p>
                    <p className="text-sm text-muted-foreground">Pending Owner</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{refundStats.pendingAdmin}</p>
                    <p className="text-sm text-muted-foreground">Pending Admin</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{refundStats.refunded}</p>
                    <p className="text-sm text-muted-foreground">Refunded</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4 text-center">
                    <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <p className="text-2xl font-bold">{refundStats.rejected}</p>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">${refundStats.totalRefunded.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total Refunded</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'pending', label: 'Pending' },
                  { key: 'all', label: 'All Requests' },
                  { key: 'refunded', label: 'Refunded' },
                  { key: 'rejected', label: 'Rejected' },
                  { key: 'failed', label: 'Failed' },
                ].map((f) => (
                  <Button
                    key={f.key}
                    variant={refundFilter === f.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRefundFilter(f.key)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>

              {/* Refund Requests List */}
              {refundRequests.length === 0 ? (
                <Card className="p-12 text-center">
                  <RefreshCcw className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Refund Requests</h3>
                  <p className="text-muted-foreground">
                    {refundFilter === 'all' ? 'No refund requests have been submitted yet.' : `No ${refundFilter} refund requests.`}
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {refundRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold">{request.students?.full_name || 'Unknown Student'}</p>
                                <p className="text-sm text-muted-foreground">{format(new Date(request.created_at), 'PPP')}</p>
                              </div>
                              {getRefundStatusBadge(request.status)}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="w-4 h-4" />
                              <span>{request.reservations?.rooms?.name} ({request.reservations?.rooms?.type}) • {request.reservations?.dorms?.name}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span>Owner: {request.owners?.full_name || 'Unknown'}</span>
                              {request.owner_decision && (
                                <Badge variant="outline" className="text-xs">Owner: {request.owner_decision}</Badge>
                              )}
                            </div>

                            <div className="p-3 bg-muted/30 rounded-lg">
                              <p className="text-sm font-medium mb-1">Reason:</p>
                              <p className="text-sm text-muted-foreground">{request.reason}</p>
                            </div>

                            {request.owner_decision_note && (
                              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <p className="text-sm font-medium mb-1 text-amber-700 dark:text-amber-300">Owner Note:</p>
                                <p className="text-sm text-amber-600 dark:text-amber-400">{request.owner_decision_note}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total to Refund</p>
                              <p className="text-2xl font-bold text-primary">${request.total_paid || request.reservations?.total_amount || 0}</p>
                            </div>

                            {canProcess(request.status) && (
                              <div className="flex flex-col gap-2">
                                <Button
                                  onClick={() => handleApproveAndProcess(request)}
                                  disabled={processing}
                                  className="gap-2 bg-green-600 hover:bg-green-700"
                                >
                                  {isOverride(request.status) && <Zap className="w-4 h-4" />}
                                  {isOverride(request.status) ? 'Override & Process' : 'Process Refund'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }}
                                  disabled={processing}
                                  className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Reject Refund Dialog */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="admin-rejection-note">Reason for Rejection *</Label>
              <Textarea
                id="admin-rejection-note"
                placeholder="Explain why you're rejecting this refund request..."
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowRejectModal(false); setSelectedRequest(null); setRejectionNote(''); }} disabled={processing}>Cancel</Button>
            <Button onClick={handleReject} disabled={processing || !rejectionNote.trim()} variant="destructive">
              {processing ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
