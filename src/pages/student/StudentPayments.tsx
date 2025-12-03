import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, DollarSign, Calendar, RefreshCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/BottomNav';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import RequestRefundModal from '@/components/payments/RequestRefundModal';

export default function StudentPayments() {
  const navigate = useNavigate();
  const { loading: authLoading, userId } = useAuthGuard();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [matchPlans, setMatchPlans] = useState<any[]>([]);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && userId) {
      loadPaymentHistory();
    }
  }, [authLoading, userId]);

  const loadPaymentHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get student ID
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!student) return;

      // Load reservations with payments
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select(`
          *,
          rooms (name, type),
          dorms (name)
        `)
        .eq('student_id', student.id)
        .in('status', ['paid', 'pending_payment', 'refunded', 'cancelled'])
        .order('created_at', { ascending: false });

      setReservations(reservationsData || []);

      // Load refund requests
      const { data: refundsData } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      setRefundRequests(refundsData || []);

      // Load AI Match plan purchases
      const { data: plansData } = await supabase
        .from('student_match_plans')
        .select('*')
        .eq('student_id', student.id)
        .order('started_at', { ascending: false });

      setMatchPlans(plansData || []);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getRefundStatusText = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_owner':
        return 'Pending Owner Review';
      case 'pending_admin':
        return 'Pending Admin Review';
      case 'approved':
        return 'Refund Approved (Processing)';
      case 'refunded':
      case 'processed':
        return 'Refund Completed';
      case 'rejected':
        return 'Refund Rejected';
      case 'failed':
        return 'Refund Failed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getRefundStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_owner':
        return 'Your refund request is being reviewed by the property owner.';
      case 'pending_admin':
        return 'Your refund has been approved by the owner and is awaiting admin processing.';
      case 'approved':
        return 'Your refund has been approved and is being processed.';
      case 'refunded':
      case 'processed':
        return 'Your refund has been processed. Funds will appear in 5-7 business days.';
      case 'rejected':
        return 'Your refund request was rejected.';
      case 'failed':
        return 'Refund processing failed. Please contact support.';
      default:
        return '';
    }
  };

  const canRequestRefund = (reservation: any) => {
    if (reservation.status !== 'paid') return false;
    if (!reservation.refundable_until) return false;
    
    const refundDeadline = new Date(reservation.refundable_until);
    if (refundDeadline < new Date()) return false;

    // Check if there's already a pending, approved, or processing refund request
    const existingRequest = refundRequests.find(
      r => r.reservation_id === reservation.id && 
      ['pending', 'pending_owner', 'pending_admin', 'approved'].includes(r.status)
    );
    
    return !existingRequest;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        {!isMobile && <Navbar />}
        <div className="container mx-auto px-6 py-32 max-w-4xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
        {isMobile && <BottomNav />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {!isMobile && <Navbar />}

      <div className="container mx-auto px-6 py-32 max-w-4xl mb-20">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-2 gradient-text">Payment History</h1>
          <p className="text-muted-foreground mb-8">
            View your reservation payments and AI Match purchases
          </p>

          {/* Reservations */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Room Reservations</h2>
            </div>

            {reservations.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No reservation payments yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => {
                  const refundDeadline = reservation.refundable_until 
                    ? new Date(reservation.refundable_until)
                    : null;
                  const canRefund = canRequestRefund(reservation);
                  const refundExpired = refundDeadline && refundDeadline < new Date();
                  const existingRefund = refundRequests.find(r => r.reservation_id === reservation.id);

                  return (
                    <Card key={reservation.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">
                            {reservation.rooms?.name} ({reservation.rooms?.type})
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {reservation.dorms?.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(reservation.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge className={getStatusColor(reservation.status)}>
                          {reservation.status === 'paid' ? 'Paid' : 
                           reservation.status === 'refunded' ? 'Refunded' :
                           reservation.status === 'cancelled' ? 'Cancelled' : 'Pending Payment'}
                        </Badge>
                      </div>

                      {/* Refund Window */}
                      {reservation.status === 'paid' && refundDeadline && (
                        <div className="mb-4 p-3 rounded-lg bg-muted/30 border">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4" />
                            {refundExpired ? (
                              <span className="text-muted-foreground">Refund window expired</span>
                            ) : (
                              <>
                                <span className="text-muted-foreground">Refund available until:</span>
                                <span className="font-medium">
                                  {refundDeadline.toLocaleDateString()} at {refundDeadline.toLocaleTimeString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4 space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Deposit Amount</span>
                          <span className="font-medium">${reservation.deposit_amount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service Fee (10%)</span>
                          <span className="font-medium">${reservation.commission_amount}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold border-t pt-2">
                          <span>Total Paid</span>
                          <span className="text-primary">${reservation.total_amount}</span>
                        </div>
                        {reservation.whish_payment_id && (
                          <p className="text-xs text-muted-foreground pt-2">
                            Payment ID: {reservation.whish_payment_id}
                          </p>
                        )}
                      </div>

                      {/* Refund Request Button or Status */}
                      {canRefund && (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-primary text-primary hover:bg-primary/10"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setShowRefundModal(true);
                          }}
                        >
                          <RefreshCcw className="w-4 h-4" />
                          Request Refund
                        </Button>
                      )}

                      {existingRefund && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Refund Request Status: {getRefundStatusText(existingRefund.status)}
                          </p>
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            {getRefundStatusDescription(existingRefund.status)}
                          </p>
                          {existingRefund.owner_decision_note && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                              Owner Note: {existingRefund.owner_decision_note}
                            </p>
                          )}
                          {existingRefund.admin_decision_note && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                              Admin Note: {existingRefund.admin_decision_note}
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Match Plans */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-secondary" />
              <h2 className="text-2xl font-bold">AI Match Purchases</h2>
            </div>

            {matchPlans.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No AI Match purchases yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/ai-match')}
                >
                  Upgrade Your Match Plan
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {matchPlans.map((plan) => (
                  <Card key={plan.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1 capitalize">
                          {plan.plan_type} Plan
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Started: {new Date(plan.started_at).toLocaleDateString()}
                          {plan.expires_at && (
                            <> • Expires: {new Date(plan.expires_at).toLocaleDateString()}</>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status === 'active' ? 'Active' : 'Expired'}
                      </Badge>
                    </div>

                    {plan.payment_id && (
                      <div className="border-t pt-4">
                        <p className="text-xs text-muted-foreground">
                          Payment ID: {plan.payment_id}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {isMobile && <BottomNav />}

      {/* Refund Request Modal */}
      {selectedReservation && (
        <RequestRefundModal
          isOpen={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedReservation(null);
          }}
          reservation={selectedReservation}
          onSuccess={loadPaymentHistory}
        />
      )}
    </div>
  );
}