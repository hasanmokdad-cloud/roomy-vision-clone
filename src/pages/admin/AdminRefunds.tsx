import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Building2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';

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

export default function AdminRefunds() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: authLoading } = useRoleGuard('admin');
  const [loading, setLoading] = useState(true);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [filter, setFilter] = useState<string>('pending');
  const [stats, setStats] = useState({
    pendingOwner: 0,
    pendingAdmin: 0,
    refunded: 0,
    rejected: 0,
    totalRefunded: 0,
  });
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRefundRequests();
  }, [filter]);

  const loadRefundRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('refund_requests')
        .select(`
          *,
          reservations (
            total_amount,
            deposit_amount,
            commission_amount,
            rooms (name, type),
            dorms (name)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filter
      if (filter === 'pending') {
        query = query.in('status', ['pending', 'pending_owner', 'pending_admin', 'approved']);
      } else if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with student and owner data
      const enrichedData = await Promise.all((data || []).map(async (request) => {
        const [studentResult, ownerResult] = await Promise.all([
          supabase.from('students').select('full_name, profile_photo_url').eq('id', request.student_id).maybeSingle(),
          supabase.from('owners').select('full_name').eq('id', request.owner_id).maybeSingle()
        ]);
        return {
          ...request,
          students: studentResult.data,
          owners: ownerResult.data,
        };
      }));

      setRefundRequests(enrichedData as RefundRequest[]);

      // Calculate stats from ALL requests
      const { data: allRequests } = await supabase
        .from('refund_requests')
        .select('status, total_paid, reservations(total_amount)');

      const requests = allRequests || [];
      const pendingOwner = requests.filter(r => r.status === 'pending' || r.status === 'pending_owner').length;
      const pendingAdmin = requests.filter(r => r.status === 'pending_admin' || r.status === 'approved').length;
      const refunded = requests.filter(r => r.status === 'refunded' || r.status === 'processed').length;
      const rejected = requests.filter(r => r.status === 'rejected').length;
      const totalRefunded = requests
        .filter(r => r.status === 'refunded' || r.status === 'processed')
        .reduce((sum, r: any) => sum + (r.total_paid || r.reservations?.total_amount || 0), 0);

      setStats({ pendingOwner, pendingAdmin, refunded, rejected, totalRefunded });
    } catch (error) {
      console.error('Error loading refund requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load refund requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndProcess = async (request: RefundRequest) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First update to approved status
      await supabase
        .from('refund_requests')
        .update({
          status: 'approved',
          admin_decision: 'approved',
        })
        .eq('id', request.id);

      // Update reservation's latest_refund_status
      await supabase
        .from('reservations')
        .update({
          latest_refund_status: 'approved',
        })
        .eq('id', request.reservation_id);

      // Call the whish-refund-handler edge function
      const { data, error } = await supabase.functions.invoke('whish-refund-handler', {
        body: {
          reservation_id: request.reservation_id,
          refund_request_id: request.id,
          initiated_by: user.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'Refund Processed',
        description: `Refund of $${request.total_paid || request.reservations?.total_amount} has been processed successfully.`,
      });

      loadRefundRequests();
    } catch (error: any) {
      console.error('Error processing refund:', error);
      
      // Update status to failed
      await supabase
        .from('refund_requests')
        .update({ status: 'failed' })
        .eq('id', request.id);

      await supabase
        .from('reservations')
        .update({ latest_refund_status: 'failed' })
        .eq('id', request.reservation_id);

      toast({
        title: 'Error',
        description: error.message || 'Failed to process refund',
        variant: 'destructive',
      });
      
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
      
      const { error } = await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          rejection_note: rejectionNote.trim(),
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
          admin_decision: 'rejected',
          admin_decision_note: rejectionNote.trim(),
          admin_id: user?.id,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Update reservation's latest_refund_status
      await supabase
        .from('reservations')
        .update({
          latest_refund_status: 'rejected',
        })
        .eq('id', selectedRequest.reservation_id);

      toast({
        title: 'Refund Rejected',
        description: 'The refund request has been rejected.',
      });

      setShowRejectModal(false);
      setRejectionNote('');
      setSelectedRequest(null);
      loadRefundRequests();
    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject refund request',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_owner':
        return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300">Pending Owner</Badge>;
      case 'pending_admin':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">Pending Admin</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">Approved (Processing)</Badge>;
      case 'refunded':
      case 'processed':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">Refunded</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-700 dark:text-red-300">Rejected</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-700 dark:text-red-300">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canProcess = (status: string) => {
    return ['pending', 'pending_owner', 'pending_admin', 'approved'].includes(status);
  };

  const isOverride = (status: string) => {
    return status === 'pending' || status === 'pending_owner';
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-3xl font-semibold text-foreground">Refund Center</h2>
            </div>
            <Button variant="outline" onClick={loadRefundRequests} className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold">{stats.pendingOwner}</p>
              <p className="text-sm text-muted-foreground">Pending Owner</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{stats.pendingAdmin}</p>
              <p className="text-sm text-muted-foreground">Pending Admin</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats.refunded}</p>
              <p className="text-sm text-muted-foreground">Refunded</p>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4 text-center">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/20">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">${stats.totalRefunded.toFixed(2)}</p>
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
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Refund Requests List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : refundRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <RefreshCcw className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Refund Requests</h3>
            <p className="text-muted-foreground">
              {filter === 'all' ? 'No refund requests have been submitted yet.' : `No ${filter} refund requests.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {refundRequests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left: Details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{request.students?.full_name || 'Unknown Student'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.created_at), 'PPP')}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>
                          {request.reservations?.rooms?.name} ({request.reservations?.rooms?.type}) •{' '}
                          {request.reservations?.dorms?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>Owner: {request.owners?.full_name || 'Unknown'}</span>
                        {request.owner_decision && (
                          <Badge variant="outline" className="text-xs">
                            Owner: {request.owner_decision}
                          </Badge>
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

                      {(request.rejection_note || request.admin_decision_note) && (
                        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                          <p className="text-sm font-medium mb-1 text-red-700 dark:text-red-300">Admin Rejection Note:</p>
                          <p className="text-sm text-red-600 dark:text-red-400">{request.rejection_note || request.admin_decision_note}</p>
                        </div>
                      )}
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total to Refund</p>
                        <p className="text-2xl font-bold text-primary">
                          ${request.total_paid || request.reservations?.total_amount || 0}
                        </p>
                      </div>

                      {canProcess(request.status) && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproveAndProcess(request)}
                            disabled={processing}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white gap-2"
                          >
                            {isOverride(request.status) && <Zap className="w-4 h-4" />}
                            <CheckCircle className="w-4 h-4" />
                            {processing ? 'Processing...' : isOverride(request.status) ? 'Override & Process' : 'Process Refund'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
                            disabled={processing}
                            className="text-red-600 border-red-600 hover:bg-red-600/10"
                          >
                            <XCircle className="w-4 h-4" />
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
      </div>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Reject Refund Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this refund request. The student will be notified.
            </p>
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Explain why this refund request is being rejected..."
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionNote.trim() || processing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
}