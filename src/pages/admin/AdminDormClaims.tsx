import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

export default function AdminDormClaims() {
  useRoleGuard('admin');
  const { toast } = useToast();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dorm_claims')
      .select(`
        *,
        dorms (
          id,
          dorm_name,
          name,
          area,
          location,
          phone_number,
          email
        ),
        owners (
          id,
          full_name,
          email,
          phone_number
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading claims:', error);
      toast({
        title: 'Error',
        description: 'Failed to load claims',
        variant: 'destructive',
      });
    } else {
      setClaims(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (claimId: string, dormId: string, ownerId: string) => {
    setProcessing(claimId);

    try {
      // Update dorm with owner_id
      const { error: dormError } = await supabase
        .from('dorms')
        .update({ owner_id: ownerId })
        .eq('id', dormId);

      if (dormError) throw dormError;

      // Update claim status
      const { error: claimError } = await supabase
        .from('dorm_claims')
        .update({
          status: 'approved',
          admin_notes: adminNotes[claimId] || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (claimError) throw claimError;

      toast({
        title: 'Claim approved',
        description: 'Dorm ownership has been transferred',
      });

      loadClaims();
    } catch (error: any) {
      console.error('Error approving claim:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve claim',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (claimId: string) => {
    setProcessing(claimId);

    try {
      const { error } = await supabase
        .from('dorm_claims')
        .update({
          status: 'rejected',
          admin_notes: adminNotes[claimId] || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (error) throw error;

      toast({
        title: 'Claim rejected',
        description: 'The claim has been rejected',
      });

      loadClaims();
    } catch (error: any) {
      console.error('Error rejecting claim:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject claim',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      approved: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
    };

    const config = variants[status] || variants.pending;

    return (
      <Badge variant={config.variant}>
        <div className="flex items-center gap-1">
          {config.icon}
          {status}
        </div>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const processedClaims = claims.filter(c => c.status !== 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Dorm Ownership Claims</h1>
        <p className="text-foreground/60 mt-2">Review and approve ownership claims</p>
      </div>

      {/* Pending Claims */}
      {pendingClaims.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Pending Claims ({pendingClaims.length})</h2>
          {pendingClaims.map((claim) => (
            <Card key={claim.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{claim.dorms?.dorm_name || claim.dorms?.name}</CardTitle>
                    <p className="text-sm text-foreground/60 mt-1">
                      {claim.dorms?.area || claim.dorms?.location}
                    </p>
                  </div>
                  {getStatusBadge(claim.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Dorm Information</h4>
                    <div className="text-sm space-y-1 text-foreground/70">
                      {claim.dorms?.phone_number && <p>📞 {claim.dorms.phone_number}</p>}
                      {claim.dorms?.email && <p>📧 {claim.dorms.email}</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Owner Information</h4>
                    <div className="text-sm space-y-1 text-foreground/70">
                      <p>👤 {claim.owners?.full_name}</p>
                      {claim.owners?.email && <p>📧 {claim.owners.email}</p>}
                      {claim.owners?.phone_number && <p>📞 {claim.owners.phone_number}</p>}
                    </div>
                  </div>
                </div>

                {claim.proof_of_ownership && (
                  <div>
                    <h4 className="font-semibold mb-2">Proof of Ownership</h4>
                    <p className="text-sm text-foreground/70 bg-muted p-3 rounded-lg">
                      {claim.proof_of_ownership}
                    </p>
                  </div>
                )}

                {claim.contact_number && (
                  <div>
                    <h4 className="font-semibold mb-2">Contact Number</h4>
                    <p className="text-sm text-foreground/70">{claim.contact_number}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor={`notes-${claim.id}`}>Admin Notes (Optional)</Label>
                  <Textarea
                    id={`notes-${claim.id}`}
                    value={adminNotes[claim.id] || ''}
                    onChange={(e) => setAdminNotes({ ...adminNotes, [claim.id]: e.target.value })}
                    placeholder="Add notes for the owner..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleReject(claim.id)}
                    disabled={processing === claim.id}
                    variant="outline"
                    className="flex-1"
                  >
                    {processing === claim.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(claim.id, claim.dorm_id, claim.owner_id)}
                    disabled={processing === claim.id}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    {processing === claim.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve & Transfer Ownership
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Processed Claims */}
      {processedClaims.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Processed Claims ({processedClaims.length})</h2>
          {processedClaims.map((claim) => (
            <Card key={claim.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{claim.dorms?.dorm_name || claim.dorms?.name}</h4>
                    <p className="text-sm text-foreground/60">
                      Owner: {claim.owners?.full_name}
                    </p>
                    {claim.admin_notes && (
                      <p className="text-sm text-foreground/70 mt-1">Note: {claim.admin_notes}</p>
                    )}
                  </div>
                  {getStatusBadge(claim.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {claims.length === 0 && (
        <Card className="p-12 text-center">
          <Clock className="w-12 h-12 mx-auto text-foreground/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Claims Yet</h3>
          <p className="text-foreground/60">Ownership claims will appear here when owners submit them</p>
        </Card>
      )}
    </div>
  );
}
