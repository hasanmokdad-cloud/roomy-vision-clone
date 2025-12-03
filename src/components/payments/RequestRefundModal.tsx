import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Calendar } from 'lucide-react';

interface RequestRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: any;
  onSuccess: () => void;
}

export default function RequestRefundModal({
  isOpen,
  onClose,
  reservation,
  onSuccess,
}: RequestRefundModalProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for your refund request.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get student and owner IDs
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) throw new Error('Student profile not found');

      // Get owner ID from dorm
      const { data: dorm } = await supabase
        .from('dorms')
        .select('owner_id')
        .eq('id', reservation.dorm_id)
        .single();

      if (!dorm) throw new Error('Dorm not found');

      // Calculate amounts
      const baseDeposit = reservation.deposit_amount || 0;
      const totalPaid = reservation.total_amount || 0;
      const refundOwnerAmount = baseDeposit;
      const refundAdminAmount = reservation.commission_amount || (baseDeposit * 0.1);

      // Create refund request with status = 'pending_owner' (new status)
      const { error: refundError } = await supabase
        .from('refund_requests')
        .insert({
          reservation_id: reservation.id,
          student_id: student.id,
          owner_id: dorm.owner_id,
          reason: reason.trim(),
          status: 'pending_owner', // Changed from 'pending' to 'pending_owner'
          base_deposit: baseDeposit,
          total_paid: totalPaid,
          refund_owner_amount: refundOwnerAmount,
          refund_admin_amount: refundAdminAmount,
        });

      if (refundError) throw refundError;

      // Update reservation's latest_refund_status
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          latest_refund_status: 'pending_owner',
        })
        .eq('id', reservation.id);

      if (reservationError) throw reservationError;

      toast({
        title: 'Refund Request Submitted',
        description: "Your refund request has been submitted. The property owner will review it soon.",
      });

      setReason('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting refund request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit refund request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const refundableUntil = reservation.refundable_until 
    ? new Date(reservation.refundable_until)
    : null;

  const content = (
    <div className="space-y-6">
      {/* Alert Banner */}
      <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
            Refund Request Policy
          </p>
          <p className="text-amber-800 dark:text-amber-200">
            Refund requests are reviewed by the property owner first, then processed by admin. Approved refunds are typically processed within 5-7 business days.
          </p>
        </div>
      </div>

      {/* Reservation Details */}
      <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
        <h4 className="font-semibold text-sm text-muted-foreground">Reservation Details</h4>
        <div className="space-y-2">
          <div>
            <p className="font-medium">{reservation.rooms?.name} ({reservation.rooms?.type})</p>
            <p className="text-sm text-muted-foreground">{reservation.dorms?.name}</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Booked: {new Date(reservation.created_at).toLocaleDateString()}
          </div>

          {refundableUntil && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Refundable until:</span>
              <span className="font-medium">
                {refundableUntil.toLocaleDateString()} at {refundableUntil.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between font-bold">
            <span>Total to Refund</span>
            <span className="text-primary">${reservation.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Reason Input */}
      <div className="space-y-2">
        <Label htmlFor="refund-reason">
          Why are you requesting a refund? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="refund-reason"
          placeholder="Please explain the reason for your refund request..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Provide as much detail as possible to help us process your request quickly.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={submitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
          className="flex-1"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Request a Refund</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a Refund</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}