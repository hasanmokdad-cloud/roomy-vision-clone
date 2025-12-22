import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Wallet, CreditCard, RefreshCcw, Plus, Trash2, RefreshCw, Eye, TrendingUp, Clock, CheckCircle, Calendar, AlertCircle, Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { OwnerWalletSkeleton, OwnerTableSkeleton, OwnerCardListSkeleton } from '@/components/skeletons/OwnerSkeletons';
import { useToast } from '@/hooks/use-toast';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OwnerBreadcrumb } from '@/components/owner/OwnerBreadcrumb';
import { format } from 'date-fns';
import { AddWhishCardModal } from '@/components/payments/AddWhishCardModal';
import { detectCardBrand } from '@/components/payments/CardBrandIcons';

interface PayoutCard {
  id: string;
  owner_id: string;
  whish_token: string;
  brand: string;
  last4: string;
  is_default: boolean;
  created_at: string;
  exp_month?: number;
  exp_year?: number;
  country?: string;
  balance?: number;
}

interface PayoutRecord {
  id: string;
  owner_id: string;
  student_id: string;
  room_id: string;
  dorm_id: string;
  deposit_amount: number;
  roomy_fee: number;
  owner_receives: number;
  currency: string;
  payment_id: string | null;
  reservation_id: string | null;
  status: string;
  created_at: string;
  room?: { name: string };
  dorm?: { name: string };
  student?: { full_name: string };
}

export default function OwnerFinanceHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { userId } = useRoleGuard('owner');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  
  // Earnings state
  const [reservations, setReservations] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProfile, setPaymentProfile] = useState<any>(null);
  
  // Wallet state
  const [payoutCard, setPayoutCard] = useState<PayoutCard | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailsModal, setDetailsModal] = useState<PayoutRecord | null>(null);
  
  // Refunds state
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const activeTab = searchParams.get('tab') || 'earnings';

  const walletTotalEarnings = payoutHistory
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.owner_receives, 0);
  
  const pendingPayouts = payoutHistory
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.owner_receives, 0);

  const lastPayout = payoutHistory.find(p => p.status === 'paid');
  const nextPending = payoutHistory.find(p => p.status === 'pending');

  useEffect(() => {
    if (userId) {
      loadOwnerData();
    }
  }, [userId]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'payout_card_added') {
      toast({
        title: 'Payout Card Added',
        description: 'Your Whish payout card has been successfully added.',
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('status');
      setSearchParams(newParams);
    }
  }, [searchParams, toast]);

  const loadOwnerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!owner) return;
      setOwnerId(owner.id);

      // Load all data in parallel
      await Promise.all([
        loadEarningsData(owner.id),
        loadWalletData(owner.id),
        loadRefundRequests(owner.id),
        loadPaymentProfile(user.id),
      ]);
    } catch (error) {
      console.error('Error loading owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentProfile = async (userId: string) => {
    const { data } = await supabase
      .from('user_payment_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setPaymentProfile(data);
  };

  const loadEarningsData = async (ownerId: string) => {
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
      const total = paid.reduce((sum, r) => sum + (r.owner_payout_amount || 0), 0);
      setTotalEarnings(total);
    }
  };

  const loadWalletData = async (ownerId: string) => {
    const { data: cards } = await supabase
      .from('owner_payment_methods')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('is_default', true)
      .limit(1);

    if (cards && cards.length > 0) {
      setPayoutCard(cards[0]);
    }

    const { data: history } = await supabase
      .from('payout_history')
      .select(`
        *,
        room:rooms(name),
        dorm:dorms(name),
        student:students(full_name)
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (history) {
      setPayoutHistory(history);
    }
  };

  const loadRefundRequests = async (ownerId: string) => {
    const { data: requests } = await supabase
      .from('refund_requests')
      .select(`
        *,
        reservations (
          *,
          rooms (name, type),
          dorms (name),
          students (full_name)
        )
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    setRefundRequests(requests || []);
  };

  const handleRefresh = async () => {
    if (!ownerId) return;
    setRefreshing(true);
    await Promise.all([
      loadEarningsData(ownerId),
      loadWalletData(ownerId),
      loadRefundRequests(ownerId),
    ]);
    setRefreshing(false);
    toast({ title: 'Refreshed', description: 'Data updated.' });
  };

  const handleAddCard = () => {
    if (ownerId) {
      navigate(`/mock-whish-owner-add-card?ownerId=${ownerId}`);
    }
  };

  const handleReplaceCard = () => {
    if (ownerId) {
      navigate(`/mock-whish-owner-add-card?ownerId=${ownerId}&replace=true`);
    }
  };

  const handleDeleteCard = async () => {
    if (!payoutCard) return;
    setDeleting(true);
    
    try {
      const { error } = await supabase
        .from('owner_payment_methods')
        .delete()
        .eq('id', payoutCard.id);

      if (error) throw error;

      setPayoutCard(null);
      setDeleteModalOpen(false);
      toast({
        title: 'Card Removed',
        description: 'Your payout card has been removed.',
      });
    } catch (error) {
      console.error('Error removing card:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove card. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveRefund = async (request: any) => {
    setProcessing(true);
    try {
      const { error: refundError } = await supabase
        .from('refund_requests')
        .update({
          status: 'pending_admin',
          owner_decision: 'approved',
        })
        .eq('id', request.id);

      if (refundError) throw refundError;

      await supabase
        .from('reservations')
        .update({ latest_refund_status: 'pending_admin' })
        .eq('id', request.reservation_id);

      toast({
        title: 'Forwarded to Admin',
        description: 'The refund request has been approved and forwarded to admin for processing.',
      });

      if (ownerId) loadRefundRequests(ownerId);
    } catch (error) {
      console.error('Error approving refund:', error);
      toast({ title: 'Error', description: 'Failed to approve refund request.', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRefund = async () => {
    if (!selectedRequest || !rejectionNote.trim()) {
      toast({ title: 'Reason Required', description: 'Please provide a reason for rejection.', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          owner_decision: 'rejected',
          owner_decision_note: rejectionNote.trim(),
        })
        .eq('id', selectedRequest.id);

      await supabase
        .from('reservations')
        .update({ latest_refund_status: 'rejected' })
        .eq('id', selectedRequest.reservation_id);

      toast({ title: 'Refund Rejected', description: 'The refund request has been rejected.' });

      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionNote('');
      if (ownerId) loadRefundRequests(ownerId);
    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast({ title: 'Error', description: 'Failed to reject refund request.', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const getEarningsStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      paid: { color: 'bg-green-500', label: 'Paid' },
      pending: { color: 'bg-amber-500', label: 'Scheduled' },
      failed: { color: 'bg-red-500', label: 'Failed (will retry)' },
      not_scheduled: { color: 'bg-gray-500', label: 'Awaiting payment' },
      processing: { color: 'bg-blue-500', label: 'Processing' },
    };
    const config = configs[status] || configs.not_scheduled;
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const getWalletStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case 'pending': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'failed': return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRefundStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_owner': return <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30">Pending Owner</Badge>;
      case 'pending_admin': return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">Pending Admin</Badge>;
      case 'approved': return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">Approved (Processing)</Badge>;
      case 'refunded':
      case 'processed': return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">Refunded</Badge>;
      case 'rejected': return <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30">Rejected</Badge>;
      case 'failed': return <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canTakeRefundAction = (status: string) => status === 'pending' || status === 'pending_owner';

  const CardBrandIcon = ({ brand }: { brand: string }) => {
    const brandLower = brand?.toLowerCase() || '';
    if (brandLower.includes('visa')) return <span className="text-blue-600 font-bold">VISA</span>;
    if (brandLower.includes('master')) return <span className="text-orange-500 font-bold">MC</span>;
    if (brandLower.includes('amex')) return <span className="text-blue-500 font-bold">AMEX</span>;
    return <CreditCard className="h-5 w-5" />;
  };

  if (loading) {
    return <OwnerWalletSkeleton />;
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          <OwnerBreadcrumb items={[{ label: 'Finance Hub' }]} />
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/owner')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  Finance Hub
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage earnings, payouts, and refund requests
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
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
              <div className="flex items-center justify-between">
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
                        ${totalEarnings.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Completed payouts</p>
                    </CardContent>
                  </Card>
                </div>
                <Button variant="outline" onClick={() => setShowPaymentModal(true)}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {paymentProfile ? 'Update Payment Info' : 'Add Payment Info'}
                </Button>
              </div>

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
                              {getEarningsStatusBadge(reservation.owner_payout_status || 'not_scheduled')}
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
                            <td colSpan={5} className="text-center p-8 text-foreground/60">No reservations yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* WALLET TAB */}
            <TabsContent value="wallet" className="space-y-6 mt-6">
              {/* Balance Summary */}
              <Card className="bg-gradient-to-br from-primary/20 via-purple-500/15 to-teal-500/20 border-white/20 overflow-hidden">
                <CardContent className="p-6">
                  <div className="bg-white/80 dark:bg-black/50 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Wallet className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">Owner Wallet</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-4xl font-black bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">
                          ${(payoutCard?.balance || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Earned: ${walletTotalEarnings.toFixed(2)}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Next Scheduled Payout
                        </p>
                        {nextPending ? (
                          <div>
                            <p className="text-2xl font-bold text-amber-600">${nextPending.owner_receives.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">From: {nextPending.room?.name || 'Room reservation'}</p>
                          </div>
                        ) : (
                          <p className="text-lg text-muted-foreground">No upcoming payouts</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Last Payout Status
                        </p>
                        {lastPayout ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-semibold text-green-600">${lastPayout.owner_receives.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(lastPayout.created_at), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-lg text-muted-foreground">No payouts yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payout Card */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payout Method (Whish Card)
                    </CardTitle>
                    <CardDescription>Your default card for receiving reservation deposits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payoutCard ? (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-8">
                              <CardBrandIcon brand={payoutCard.brand} />
                              <Badge variant="secondary" className="bg-white/10 border-white/20 text-white">Default</Badge>
                            </div>
                            <p className="text-xl tracking-widest mb-4">•••• •••• •••• {payoutCard.last4}</p>
                            <div className="flex justify-between text-sm">
                              <div>
                                <p className="text-white/60 text-xs">EXPIRES</p>
                                <p>{payoutCard.exp_month && payoutCard.exp_year ? `${String(payoutCard.exp_month).padStart(2, '0')}/${payoutCard.exp_year}` : '••/••'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white/60 text-xs">COUNTRY</p>
                                <p>{payoutCard.country || 'Lebanon'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleReplaceCard} className="flex-1">Change Card</Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(true)} className="text-destructive hover:text-destructive flex-1">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-lg border-dashed">
                        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground mb-1">No payout card added yet.</p>
                        <p className="text-sm text-muted-foreground mb-4">Add a Whish card to receive deposits.</p>
                        <Button onClick={handleAddCard}>
                          <Plus className="h-4 w-4 mr-2" />
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
                      <TrendingUp className="h-5 w-5" />
                      Payout Summary
                    </CardTitle>
                    <CardDescription>Overview of your earnings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                        <p className="text-2xl font-bold text-green-600">${walletTotalEarnings.toFixed(2)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm text-muted-foreground mb-1">Pending</p>
                        <p className="text-2xl font-bold text-amber-600">${pendingPayouts.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
                      <p className="text-2xl font-bold">{payoutHistory.length}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payout History */}
              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutHistory.slice(0, 10).map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{format(new Date(record.created_at), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{record.room?.name || 'N/A'}</TableCell>
                            <TableCell>{record.student?.full_name || 'N/A'}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">${record.owner_receives.toFixed(2)}</TableCell>
                            <TableCell>{getWalletStatusBadge(record.status)}</TableCell>
                          </TableRow>
                        ))}
                        {payoutHistory.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payout history yet</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* REFUNDS TAB */}
            <TabsContent value="refunds" className="space-y-6 mt-6">
              {refundRequests.length === 0 ? (
                <Card className="rounded-2xl shadow-md">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-medium text-foreground mb-2">No Refund Requests</p>
                    <p className="text-muted-foreground">You haven't received any refund requests yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {refundRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-foreground mb-1">
                                {request.reservations?.rooms?.name} ({request.reservations?.rooms?.type})
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">{request.reservations?.dorms?.name}</p>
                              <p className="text-sm text-foreground">
                                Student: <span className="font-medium">{request.reservations?.students?.full_name}</span>
                              </p>
                            </div>
                            {getRefundStatusBadge(request.status)}
                          </div>

                          <div className="border-t pt-4 mb-4 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground block">Deposit</span>
                              <span className="font-medium text-foreground">${request.reservations?.deposit_amount}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Service Fee</span>
                              <span className="font-medium text-foreground">${request.reservations?.commission_amount}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Total</span>
                              <span className="font-bold text-foreground">${request.reservations?.total_amount}</span>
                            </div>
                          </div>

                          <div className="mb-4 p-3 bg-muted/30 rounded-xl">
                            <p className="text-sm font-medium text-foreground mb-1">Reason for Refund:</p>
                            <p className="text-sm text-muted-foreground">{request.reason}</p>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Requested: {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          {canTakeRefundAction(request.status) && (
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleApproveRefund(request)}
                                disabled={processing}
                                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 rounded-xl"
                              >
                                <Check className="w-4 h-4" />
                                Approve & Forward to Admin
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }}
                                disabled={processing}
                                className="flex-1 gap-2 border-red-500 text-red-600 hover:bg-red-50 rounded-xl"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {request.owner_decision_note && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900">
                              <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Rejection Reason:</p>
                              <p className="text-sm text-red-800 dark:text-red-200">{request.owner_decision_note}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Payment Modal */}
      <AddWhishCardModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSuccess={() => userId && loadPaymentProfile(userId)}
      />

      {/* Delete Card Dialog */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payout Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payout card? You will need to add a new card to receive future payouts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Removing...' : 'Remove Card'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Refund Dialog */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject Refund Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this refund request. The student will see this explanation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-note">
                Reason for Rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-note"
                placeholder="Explain why you're rejecting this refund request..."
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={4}
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setShowRejectModal(false); setSelectedRequest(null); setRejectionNote(''); }}
                disabled={processing}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectRefund}
                disabled={processing || !rejectionNote.trim()}
                variant="destructive"
                className="flex-1 rounded-xl"
              >
                {processing ? 'Rejecting...' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
}
