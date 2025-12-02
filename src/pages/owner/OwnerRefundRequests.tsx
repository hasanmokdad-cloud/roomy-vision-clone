import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Navbar from '@/components/shared/Navbar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

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

      // Get owner ID
      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!owner) return;

      setOwnerId(owner.id);

      // Load refund requests
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
      const { error } = await supabase
        .from('refund_requests')
        .update({
          status: 'approved',
          owner_decision: 'approved',
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: 'Refund Approved',
        description: 'The refund request has been approved. Admin will process the payment.',
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
      const { error } = await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          owner_decision: 'rejected',
          owner_decision_note: rejectionNote.trim(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'processed':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-32 max-w-4xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      <div className="container mx-auto px-6 py-32 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/owner')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-2 gradient-text">Refund Requests</h1>
          <p className="text-muted-foreground mb-8">
            Manage refund requests from students for your properties
          </p>

          {refundRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-medium mb-2">No Refund Requests</p>
              <p className="text-muted-foreground">
                You haven't received any refund requests yet
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {refundRequests.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">
                        {request.reservations?.rooms?.name} ({request.reservations?.rooms?.type})
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {request.reservations?.dorms?.name}
                      </p>
                      <p className="text-sm">
                        Student: <span className="font-medium">{request.reservations?.students?.full_name}</span>
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status === 'pending' ? 'Pending' : 
                       request.status === 'approved' ? 'Approved' :
                       request.status === 'rejected' ? 'Rejected' : 'Processed'}
                    </Badge>
                  </div>

                  {/* Amounts */}
                  <div className="border-t pt-4 mb-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Deposit</span>
                      <span className="font-medium">${request.reservations?.deposit_amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Service Fee</span>
                      <span className="font-medium">${request.reservations?.commission_amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total</span>
                      <span className="font-bold">${request.reservations?.total_amount}</span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium mb-1">Reason for Refund:</p>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(request)}
                        disabled={processing}
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                        Approve Refund
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        disabled={processing}
                        className="flex-1 gap-2 border-red-500 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Owner Decision Note */}
                  {request.owner_decision_note && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {request.owner_decision_note}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Rejection Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
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
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={processing || !rejectionNote.trim()}
                variant="destructive"
                className="flex-1"
              >
                {processing ? 'Rejecting...' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
