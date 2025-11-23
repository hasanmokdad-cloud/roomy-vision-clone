import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export function PendingApprovalsQueue() {
  const [pendingDorms, setPendingDorms] = useState<any[]>([]);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/owner-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          dorm_id: dormId,
          new_status: 'Verified'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve dorm');
      }

      toast({
        title: 'Success',
        description: 'Dorm approved successfully',
      });

      loadPendingItems();
    } catch (error: any) {
      console.error('Error approving dorm:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve dorm',
        variant: 'destructive',
      });
    }
  };

  const rejectDorm = async (dormId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/owner-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          dorm_id: dormId,
          new_status: 'Rejected'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject dorm');
      }

      toast({
        title: 'Success',
        description: 'Dorm rejected',
      });

      loadPendingItems();
    } catch (error: any) {
      console.error('Error rejecting dorm:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject dorm',
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Pending Approvals
        </CardTitle>
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
                    <div className="flex gap-2">
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
                        onClick={() => rejectDorm(dorm.id)}
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
    </Card>
  );
}
