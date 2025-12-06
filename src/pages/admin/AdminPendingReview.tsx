import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { AdminDormPreviewModal } from '@/components/admin/AdminDormPreviewModal';
import { ArrowLeft, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminPendingReview() {
  const { loading: authLoading } = useRoleGuard('admin');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pendingDorms, setPendingDorms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDorm, setSelectedDorm] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPendingDorms();
  }, []);

  const loadPendingDorms = async () => {
    try {
      const { data, error } = await supabase
        .from('dorms')
        .select('*, rooms(id, name, type, price, available)')
        .eq('verification_status', 'Pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingDorms(data || []);
    } catch (error) {
      console.error('Error loading dorms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending dorms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (dormId: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('admin_update_verification_status', {
        p_dorm_id: dormId,
        p_new_status: 'Verified',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Dorm approved successfully',
      });

      await loadPendingDorms();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDorm || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('admin_update_verification_status', {
        p_dorm_id: selectedDorm.id,
        p_new_status: 'Rejected',
        p_rejection_reason: rejectionReason,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Dorm rejected with reason',
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedDorm(null);
      await loadPendingDorms();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <h1 className="text-4xl font-bold gradient-text mb-2">Pending Reviews</h1>
          <p className="text-foreground/70 mb-8">Review and approve dorm submissions</p>

          {pendingDorms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <p className="text-foreground/60 text-center">No pending dorms to review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingDorms.map((dorm) => (
                <Card key={dorm.id} className="glass-hover">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {dorm.image_url && (
                        <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={dorm.image_url}
                            alt={dorm.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-xl font-bold">{dorm.name || dorm.dorm_name}</h3>
                          <p className="text-sm text-foreground/60">
                            📍 {dorm.area || dorm.location}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">💰 ${dorm.monthly_price || dorm.price}/mo</Badge>
                          {dorm.capacity && (
                            <Badge variant="outline">👥 {dorm.capacity} capacity</Badge>
                          )}
                          {dorm.gender_preference && (
                            <Badge variant="secondary">{dorm.gender_preference}</Badge>
                          )}
                        </div>

                        {dorm.university && (
                          <p className="text-sm text-foreground/60">
                            🎓 Near {dorm.university}
                          </p>
                        )}

                        {dorm.description && (
                          <p className="text-sm text-foreground/70 line-clamp-2">
                            {dorm.description}
                          </p>
                        )}

                        {dorm.rooms && dorm.rooms.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-foreground/80 mb-1">
                              Rooms ({dorm.rooms.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {dorm.rooms.slice(0, 3).map((room: any) => (
                                <Badge key={room.id} variant="outline" className="text-xs">
                                  {room.name} - ${room.price}
                                </Badge>
                              ))}
                              {dorm.rooms.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{dorm.rooms.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-foreground/40">
                          Submitted {new Date(dorm.created_at).toLocaleDateString()} at{' '}
                          {new Date(dorm.created_at).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex md:flex-col gap-2 shrink-0">
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
                          onClick={() => handleApprove(dorm.id)}
                          disabled={submitting}
                          className="bg-green-500 hover:bg-green-600 gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedDorm(dorm);
                            setShowRejectDialog(true);
                          }}
                          disabled={submitting}
                          className="gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <AdminDormPreviewModal
          dorm={selectedDorm}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedDorm(null);
          }}
        />

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
                onClick={handleReject}
                disabled={!rejectionReason.trim() || submitting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}