import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Check, X, AlertCircle, ArrowRight } from 'lucide-react';
import { OwnerCardListSkeleton } from '@/components/skeletons/OwnerSkeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { OwnerLayout } from '@/components/owner/OwnerLayout';

export default function OwnerRefundRequests() {
  const navigate = useNavigate();
  const { loading: authLoading, userId } = useAuthGuard();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && userId) {
      loadOwnerData();
    }
  }, [authLoading, userId]);

  const loadOwnerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!owner) return;

      setOwnerId(owner.id);

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
        .eq('owner_id', owner.id)
        .order('created_at', { ascending: false });

      setRefundRequests(requests || []);
    } catch (error) {
      console.error('Error loading refund requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: any) => {
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

      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          latest_refund_status: 'pending_admin',
        })
        .eq('id', request.reservation_id);

      if (reservationError) throw reservationError;

      toast({
        title: 'Forwarded to Admin',
        description: 'The refund request has been approved and forwarded to admin for processing.',
      });

      loadOwnerData();
    } catch (error) {
      console.error('Error approving refund:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve refund request.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionNote.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { error: refundError } = await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          owner_decision: 'rejected',
          owner_decision_note: rejectionNote.trim(),
        })
        .eq('id', selectedRequest.id);

      if (refundError) throw refundError;

      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          latest_refund_status: 'rejected',
        })
        .eq('id', selectedRequest.reservation_id);

      if (reservationError) throw reservationError;

      toast({
        title: 'Refund Rejected',
        description: 'The refund request has been rejected.',
      });

      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionNote('');
      loadOwnerData();
    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject refund request.',
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
        return <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30">Pending Owner</Badge>;
      case 'pending_admin':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">Pending Admin</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">Approved (Processing)</Badge>;
      case 'refunded':
      case 'processed':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">Refunded</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30">Rejected</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canTakeAction = (status: string) => {
    return status === 'pending' || status === 'pending_owner';
  };

  if (authLoading || loading) {
    return <OwnerCardListSkeleton />;
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-semibold text-gray-800">Refund Requests</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage refund requests from students for your properties
            </p>
          </motion.div>

          {refundRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-xl font-medium text-gray-700 mb-2">No Refund Requests</p>
                  <p className="text-gray-500">
                    You haven't received any refund requests yet
                  </p>
                </CardContent>
              </Card>
            </motion.div>
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
                          <h3 className="font-bold text-lg text-gray-700 mb-1">
                            {request.reservations?.rooms?.name} ({request.reservations?.rooms?.type})
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {request.reservations?.dorms?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Student: <span className="font-medium">{request.reservations?.students?.full_name}</span>
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="border-t pt-4 mb-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 block">Deposit</span>
                          <span className="font-medium text-gray-700">${request.reservations?.deposit_amount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Service Fee</span>
                          <span className="font-medium text-gray-700">${request.reservations?.commission_amount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Total</span>
                          <span className="font-bold text-gray-800">${request.reservations?.total_amount}</span>
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-muted/30 rounded-xl">
                        <p className="text-sm font-medium text-gray-700 mb-1">Reason for Refund:</p>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </div>
                        {request.processed_at && (
                          <span>
                            Processed: {new Date(request.processed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {canTakeAction(request.status) && (
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApprove(request)}
                            disabled={processing}
                            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 rounded-xl"
                          >
                            <Check className="w-4 h-4" />
                            Approve & Forward to Admin
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
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
                          <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                            Rejection Reason:
                          </p>
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {request.owner_decision_note}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionNote('');
                }}
                disabled={processing}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
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