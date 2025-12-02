import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Filter, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/shared/Navbar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export default function AdminPaymentsDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: authLoading, userId } = useAuthGuard();
  const { role, loading: roleLoading } = useRoleGuard();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refundFilter, setRefundFilter] = useState<string>('all');
  const [processing, setProcessing] = useState(false);

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

      // Load refund requests
      const { data: refundsData } = await supabase
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
        .order('created_at', { ascending: false });

      setRefundRequests(refundsData || []);

      // Load payment disputes
      const { data: disputesData } = await supabase
        .from('payment_disputes')
        .select(`
          *,
          reservations (
            *,
            rooms (name),
            dorms (name),
            students (full_name)
          )
        `)
        .order('created_at', { ascending: false });

      setDisputes(disputesData || []);

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

  const handleProcessRefund = async (refundRequest: any) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke('whish-refund-handler', {
        body: {
          reservation_id: refundRequest.reservation_id,
          refund_request_id: refundRequest.id,
          initiated_by: user.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'Refund Processed',
        description: 'The refund has been processed successfully.',
      });

      loadPaymentData();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Error',
        description: 'Failed to process refund.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRefund = async (refundRequestId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('refund_requests')
        .update({ status: 'rejected' })
        .eq('id', refundRequestId);

      if (error) throw error;

      toast({
        title: 'Refund Rejected',
        description: 'The refund request has been rejected.',
      });

      loadPaymentData();
    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject refund.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredRefunds = refundRequests.filter(r => {
    if (refundFilter !== 'all' && r.status !== refundFilter) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending_payment':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'refunded':
      case 'partially_refunded':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'expired':
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'approved':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'processed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
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
          <h1 className="text-4xl font-bold mb-2 gradient-text">Payments & Refunds Dashboard</h1>
          <p className="text-muted-foreground mb-8">
            Monitor all platform payments, refunds, and disputes
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

          {/* Tabs for different sections */}
          <Tabs defaultValue="payments" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="refunds">Refund Queue</TabsTrigger>
              <TabsTrigger value="disputes">Disputes</TabsTrigger>
            </TabsList>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
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
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
            </TabsContent>

            {/* Refunds Tab */}
            <TabsContent value="refunds" className="space-y-4">
              <div className="flex gap-4 mb-6">
                <Select value={refundFilter} onValueChange={setRefundFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredRefunds.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No refund requests found</p>
                </Card>
              ) : (
                filteredRefunds.map((refund) => (
                  <Card key={refund.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">
                          {refund.reservations?.rooms?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {refund.reservations?.dorms?.name}
                        </p>
                        <p className="text-sm mb-1">
                          Student: <span className="font-medium">{refund.reservations?.students?.full_name}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Requested: {new Date(refund.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getRefundStatusColor(refund.status)}>
                        {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Refund Reason */}
                    <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">Reason:</p>
                      <p className="text-sm text-muted-foreground">{refund.reason}</p>
                    </div>

                    {/* Amounts */}
                    <div className="border-t pt-4 mb-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">Deposit</span>
                        <span className="font-medium">${refund.reservations?.deposit_amount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Service Fee</span>
                        <span className="font-medium">${refund.reservations?.commission_amount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Total Refund</span>
                        <span className="font-bold">${refund.reservations?.total_amount}</span>
                      </div>
                    </div>

                    {/* Owner Decision */}
                    {refund.owner_decision && (
                      <div className={`mb-4 p-3 rounded-lg ${
                        refund.owner_decision === 'approved' 
                          ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
                          : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
                      }`}>
                        <p className="text-sm font-medium mb-1">
                          Owner Decision: {refund.owner_decision.charAt(0).toUpperCase() + refund.owner_decision.slice(1)}
                        </p>
                        {refund.owner_decision_note && (
                          <p className="text-sm">{refund.owner_decision_note}</p>
                        )}
                      </div>
                    )}

                    {/* Admin Actions */}
                    {refund.status === 'approved' && (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleProcessRefund(refund)}
                          disabled={processing}
                          className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {processing ? 'Processing...' : 'Force Approve & Process'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRejectRefund(refund.id)}
                          disabled={processing}
                          className="flex-1 gap-2 border-red-500 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {refund.status === 'pending' && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          Waiting for owner approval
                        </p>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes" className="space-y-4">
              {disputes.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-xl font-medium mb-2">No Disputes</p>
                  <p className="text-muted-foreground">
                    All payment disputes will appear here
                  </p>
                </Card>
              ) : (
                disputes.map((dispute) => (
                  <Card key={dispute.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">
                          {dispute.reservations?.rooms?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Student: {dispute.reservations?.students?.full_name}
                        </p>
                        <p className="text-sm">
                          Issue Type: <span className="font-medium capitalize">{dispute.issue_type?.replace('_', ' ')}</span>
                        </p>
                      </div>
                      <Badge>
                        {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1).replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">Description:</p>
                      <p className="text-sm text-muted-foreground">{dispute.description}</p>
                    </div>

                    {dispute.resolution_notes && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                        <p className="text-sm font-medium mb-1">Resolution Notes:</p>
                        <p className="text-sm">{dispute.resolution_notes}</p>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
