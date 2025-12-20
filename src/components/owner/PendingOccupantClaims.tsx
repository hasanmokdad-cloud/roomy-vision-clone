import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, User, Building2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PendingClaim {
  id: string;
  created_at: string;
  student: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
    university: string | null;
    email: string;
  };
  room: {
    id: string;
    name: string;
    type: string;
  };
  dorm: {
    id: string;
    name: string;
  };
}

interface PendingOccupantClaimsProps {
  ownerId: string;
  onClaimProcessed?: () => void;
}

export function PendingOccupantClaims({ ownerId, onClaimProcessed }: PendingOccupantClaimsProps) {
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<PendingClaim | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  // Load pending claims function
  const loadPendingClaims = useCallback(async () => {
    if (!ownerId || ownerId.trim() === '') return;
    
    try {
      const { data, error } = await supabase
        .from('room_occupancy_claims')
        .select(`
          id,
          created_at,
          student_id,
          room_id,
          dorm_id
        `)
        .eq('owner_id', ownerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch related data for each claim
      const claimsWithDetails = await Promise.all(
        (data || []).map(async (claim) => {
          const [studentRes, roomRes, dormRes] = await Promise.all([
            supabase
              .from('students')
              .select('id, full_name, profile_photo_url, university, email')
              .eq('id', claim.student_id)
              .single(),
            supabase
              .from('rooms')
              .select('id, name, type')
              .eq('id', claim.room_id)
              .single(),
            supabase
              .from('dorms')
              .select('id, name')
              .eq('id', claim.dorm_id)
              .single(),
          ]);

          return {
            id: claim.id,
            created_at: claim.created_at,
            student: studentRes.data || {
              id: claim.student_id,
              full_name: 'Unknown Student',
              profile_photo_url: null,
              university: null,
              email: '',
            },
            room: roomRes.data || { id: claim.room_id, name: 'Unknown Room', type: 'Unknown' },
            dorm: dormRes.data || { id: claim.dorm_id, name: 'Unknown Dorm' },
          };
        })
      );

      setClaims(claimsWithDetails);
    } catch (error) {
      console.error('Error loading pending claims:', error);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  // Initial load
  useEffect(() => {
    if (ownerId && ownerId.trim() !== '') {
      loadPendingClaims();
    } else {
      setLoading(false);
    }
  }, [ownerId, loadPendingClaims]);

  // Real-time subscription for new claims
  useEffect(() => {
    if (!ownerId || ownerId.trim() === '') return;

    const channel = supabase
      .channel(`owner-claims-${ownerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_occupancy_claims',
          filter: `owner_id=eq.${ownerId}`
        },
        (payload) => {
          console.log('Real-time claim update for owner:', payload);
          // Refresh claims list when any change occurs
          loadPendingClaims();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId, loadPendingClaims]);

  const handleConfirm = async (claim: PendingClaim) => {
    setProcessingId(claim.id);
    try {
      const { error } = await supabase.functions.invoke('confirm-room-occupant', {
        body: {
          claimId: claim.id,
          action: 'confirm',
        },
      });

      if (error) throw error;

      toast({
        title: 'Claim Confirmed',
        description: `${claim.student.full_name} has been confirmed for ${claim.room.name}`,
      });

      setClaims(prev => prev.filter(c => c.id !== claim.id));
      onClaimProcessed?.();
    } catch (error) {
      console.error('Error confirming claim:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm the claim. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (claim: PendingClaim) => {
    setSelectedClaim(claim);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedClaim) return;
    
    setProcessingId(selectedClaim.id);
    setRejectDialogOpen(false);

    try {
      const { error } = await supabase.functions.invoke('confirm-room-occupant', {
        body: {
          claimId: selectedClaim.id,
          action: 'reject',
          rejectionReason: rejectionReason || 'No reason provided',
        },
      });

      if (error) throw error;

      toast({
        title: 'Claim Rejected',
        description: `${selectedClaim.student.full_name}'s claim has been rejected`,
      });

      setClaims(prev => prev.filter(c => c.id !== selectedClaim.id));
      onClaimProcessed?.();
    } catch (error) {
      console.error('Error rejecting claim:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject the claim. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
      setSelectedClaim(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Card className="rounded-2xl shadow-md border-amber-200 bg-amber-50/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (claims.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="rounded-2xl shadow-md border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-5 h-5" />
            Pending Room Claims
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 ml-2">
              {claims.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {claims.map(claim => (
            <div
              key={claim.id}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-amber-100 shadow-sm"
            >
              <Avatar className="h-12 w-12 border-2 border-amber-200">
                <AvatarImage src={claim.student.profile_photo_url || undefined} />
                <AvatarFallback className="bg-amber-100 text-amber-700">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {claim.student.full_name}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">
                    {claim.room.name} • {claim.dorm.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(claim.created_at)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => openRejectDialog(claim)}
                  disabled={processingId === claim.id}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleConfirm(claim)}
                  disabled={processingId === claim.id}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Confirm
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Room Claim</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedClaim?.student.full_name}'s claim for{' '}
              {selectedClaim?.room.name}? The student will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Reason (optional)</Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g., Room is already occupied, incorrect room selection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
