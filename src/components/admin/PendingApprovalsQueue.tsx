import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdminDormPreviewModal } from './AdminDormPreviewModal';
import { Clock, CheckCircle, XCircle, Eye, ArrowRight } from 'lucide-react';

export function PendingApprovalsQueue() {
  const navigate = useNavigate();
  const [pendingDorms, setPendingDorms] = useState<any[]>([]);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedDorm, setSelectedDorm] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadPendingItems();
  }, []);

  const loadPendingItems = async () => {
    try {
      // Load pending dorms
      const { data: dorms } = await supabase
        .from('dorms')
        .select('*')
        .eq('verification_status', 'Pending')
        .order('created_at', { ascending: false })
        .limit(10);

      setPendingDorms(dorms || []);

      // Load pending claims
      const { data: claims } = await supabase
        .from('dorm_claims')
        .select('*, dorms(dorm_name), owners(full_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      setPendingClaims(claims || []);
    } catch (error) {
      console.error('Error loading pending items:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveDorm = async (dormId: string) => {
    try {
      console.log('🔍 [Approve] Starting approval for dorm:', dormId);
      
      // Try RPC function directly (more reliable than edge function)
      const { data, error } = await supabase.rpc('admin_update_verification_status', {
        p_dorm_id: dormId,
        p_new_status: 'Verified'
      });

      if (error) {
        console.error('❌ [Approve] RPC Error Details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast({
          title: 'Verification Failed',
          description: `${error.message}${error.hint ? ` - ${error.hint}` : ''}`,
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ [Approve] Success!', data);
      
      toast({
        title: 'Success',
        description: 'Dorm verified successfully',
      });

      // Reload the list
      await loadPendingItems();
    } catch (error: any) {
      console.error('❌ [Approve] Unexpected Error:', {
        message: error.message,
        type: error.constructor.name,
        stack: error.stack
      });
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleRejectClick = (dorm: any) => {
    setSelectedDorm(dorm);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedDorm || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('🔍 [Reject] Starting rejection for dorm:', selectedDorm.id);
      
      const { data, error } = await supabase.rpc('admin_update_verification_status', {
        p_dorm_id: selectedDorm.id,
        p_new_status: 'Rejected',
        p_rejection_reason: rejectionReason,
      });

      if (error) {
        console.error('❌ [Reject] RPC Error Details:', error);
        toast({
          title: 'Rejection Failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ [Reject] Success!', data);
      
      toast({
        title: 'Success',
        description: 'Dorm rejected with reason provided',
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedDorm(null);
      await loadPendingItems();
    } catch (error: any) {
      console.error('❌ [Reject] Unexpected Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const approveClaim = async (claimId: string) => {
    try {
      const { error } = await supabase
        .from('dorm_claims')
        .update({ status: 'approved' })
        .eq('id', claimId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Claim approved successfully',
      });

      loadPendingItems();
    } catch (error) {
      console.error('Error approving claim:', error);
    }
  };

  const rejectClaim = async (claimId: string) => {
    try {
      const { error } = await supabase
        .from('dorm_claims')
        .update({ status: 'rejected' })
        .eq('id', claimId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Claim rejected',
      });

      loadPendingItems();
    } catch (error) {
      console.error('Error rejecting claim:', error);
    }
  };

  if (loading) {
    return (
      <Card className="glass-hover">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-hover">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Pending Approvals
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/admin/pending-review')}
          className="gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dorms">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dorms">
              Dorms
              {pendingDorms.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingDorms.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="claims">
              Claims
              {pendingClaims.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingClaims.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dorms" className="space-y-3 mt-4">
            {pendingDorms.length === 0 ? (
              <p className="text-center text-foreground/60 py-8">No pending dorms</p>
            ) : (
              pendingDorms.map((dorm) => (
                <div
                  key={dorm.id}
                  className="p-4 bg-muted/20 rounded-lg border border-border/40"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        {dorm.image_url && (
                          <img
                            src={dorm.image_url}
                            alt={dorm.dorm_name || dorm.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{dorm.dorm_name || dorm.name}</h4>
                          <p className="text-sm text-foreground/60 mt-1">
                            📍 {dorm.area} {dorm.address && `• ${dorm.address}`}
                          </p>
                          <p className="text-sm text-foreground/60">
                            💰 ${dorm.monthly_price || dorm.price}/mo
                            {dorm.capacity && ` • Capacity: ${dorm.capacity}`}
                          </p>
                          {dorm.university && (
                            <p className="text-sm text-foreground/60">
                              🎓 Near {dorm.university}
                            </p>
                          )}
                          {dorm.description && (
                            <p className="text-xs text-foreground/50 mt-2 line-clamp-2">
                              {dorm.description}
                            </p>
                          )}
                          <p className="text-xs text-foreground/40 mt-2">
                            Submitted {new Date(dorm.created_at).toLocaleDateString()} at{' '}
                            {new Date(dorm.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDorm(dorm);
                          setShowPreview(true);
                        }}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveDorm(dorm.id)}
                        className="bg-green-500 hover:bg-green-600 gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(dorm)}
                        className="gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="claims" className="space-y-3 mt-4">
            {pendingClaims.length === 0 ? (
              <p className="text-center text-foreground/60 py-8">No pending claims</p>
            ) : (
              pendingClaims.map((claim: any) => (
                <div
                  key={claim.id}
                  className="p-4 bg-muted/20 rounded-lg border border-border/40"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{claim.dorms?.dorm_name}</h4>
                      <p className="text-sm text-foreground/60 mt-1">
                        Claimed by: {claim.owners?.full_name}
                      </p>
                      <p className="text-xs text-foreground/40 mt-1">
                        {claim.owners?.email}
                      </p>
                      <p className="text-xs text-foreground/40 mt-1">
                        Submitted {new Date(claim.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveClaim(claim.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectClaim(claim.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Preview Modal */}
      <AdminDormPreviewModal
        dorm={selectedDorm}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setSelectedDorm(null);
        }}
      />

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Dorm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this dorm. The owner will see this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-4">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Images are unclear, missing contact information, incorrect pricing..."
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setRejectionReason('');
              setSelectedDorm(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
