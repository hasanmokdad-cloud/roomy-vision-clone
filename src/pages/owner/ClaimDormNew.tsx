import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { ArrowLeft, Search, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

export default function ClaimDormNew() {
  const { userId } = useRoleGuard('owner');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [myClaims, setMyClaims] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState({
    dorm_name: '',
    phone_number: '',
    email: '',
  });

  const [claimForm, setClaimForm] = useState<{
    dormId: string | null;
    proof: string;
    contactNumber: string;
  }>({
    dormId: null,
    proof: '',
    contactNumber: '',
  });

  useEffect(() => {
    if (!userId) return;

    const fetchOwnerData = async () => {
      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (owner) {
        setOwnerId(owner.id);
        loadMyClaims(owner.id);
      }
    };

    fetchOwnerData();
  }, [userId]);

  const loadMyClaims = async (ownerId: string) => {
    const { data } = await supabase
      .from('dorm_claims')
      .select(`
        *,
        dorms (
          id,
          dorm_name,
          name,
          area,
          location
        )
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (data) setMyClaims(data);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);

    try {
      let query = supabase
        .from('dorms')
        .select('*')
        .is('owner_id', null)
        .eq('verification_status', 'Verified');

      if (searchQuery.dorm_name) {
        query = query.or(`dorm_name.ilike.%${searchQuery.dorm_name}%,name.ilike.%${searchQuery.dorm_name}%,area.ilike.%${searchQuery.dorm_name}%`);
      }
      if (searchQuery.phone_number) {
        query = query.eq('phone_number', searchQuery.phone_number);
      }
      if (searchQuery.email) {
        query = query.eq('email', searchQuery.email);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSearchResults(data || []);

      if (!data || data.length === 0) {
        toast({
          title: 'No matches found',
          description: 'Try different search criteria or add a new dorm instead.',
        });
      }
    } catch (error: any) {
      console.error('Error searching:', error);
      toast({
        title: 'Error',
        description: 'Failed to search. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerId || !claimForm.dormId) return;

    setClaiming(true);

    try {
      const { error } = await supabase
        .from('dorm_claims')
        .insert({
          dorm_id: claimForm.dormId,
          owner_id: ownerId,
          proof_of_ownership: claimForm.proof,
          contact_number: claimForm.contactNumber,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Claim submitted!',
        description: 'Your claim is pending admin review.',
      });

      setClaimForm({ dormId: null, proof: '', contactNumber: '' });
      setSearchResults([]);
      if (ownerId) loadMyClaims(ownerId);
    } catch (error: any) {
      console.error('Error submitting claim:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit claim',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <OwnerSidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/owner')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-4xl font-bold gradient-text mb-4">Claim Your Dorm</h1>
          <p className="text-foreground/70 mb-8">
            Search for your existing dorm and submit a claim request for admin approval.
          </p>

          {/* My Claims */}
          {myClaims.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>My Claim Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myClaims.map((claim) => (
                    <div key={claim.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <h4 className="font-semibold">{claim.dorms?.dorm_name || claim.dorms?.name}</h4>
                        <p className="text-sm text-foreground/60">{claim.dorms?.area || claim.dorms?.location}</p>
                        {claim.admin_notes && (
                          <p className="text-sm text-foreground/70 mt-1">Note: {claim.admin_notes}</p>
                        )}
                      </div>
                      <Badge variant={claim.status === 'approved' ? 'default' : claim.status === 'rejected' ? 'destructive' : 'secondary'}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(claim.status)}
                          {claim.status}
                        </div>
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Form */}
          <Card className="p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dorm_name">Dorm Name</Label>
                  <Input
                    id="dorm_name"
                    value={searchQuery.dorm_name}
                    onChange={(e) => setSearchQuery({ ...searchQuery, dorm_name: e.target.value })}
                    placeholder="Search by name..."
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={searchQuery.phone_number}
                    onChange={(e) => setSearchQuery({ ...searchQuery, phone_number: e.target.value })}
                    placeholder="Search by phone..."
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={searchQuery.email}
                    onChange={(e) => setSearchQuery({ ...searchQuery, email: e.target.value })}
                    placeholder="Search by email..."
                  />
                </div>
              </div>

              <Button type="submit" disabled={searching} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                {searching ? 'Searching...' : 'Search Dorms'}
              </Button>
            </form>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Search Results</h2>
              {searchResults.map((dorm) => (
                <Card key={dorm.id} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{dorm.dorm_name || dorm.name}</h3>
                      <div className="space-y-1 text-sm text-foreground/70">
                        <p>📍 {dorm.area || dorm.location}</p>
                        {dorm.phone_number && <p>📞 {dorm.phone_number}</p>}
                        {dorm.email && <p>📧 {dorm.email}</p>}
                        {dorm.university && <p>🎓 Near {dorm.university}</p>}
                      </div>
                      <Badge variant="secondary" className="mt-3">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>

                    {claimForm.dormId === dorm.id ? (
                      <form onSubmit={handleClaimSubmit} className="space-y-4 pt-4 border-t">
                        <div>
                          <Label htmlFor="proof">Proof of Ownership</Label>
                          <Textarea
                            id="proof"
                            value={claimForm.proof}
                            onChange={(e) => setClaimForm({ ...claimForm, proof: e.target.value })}
                            placeholder="Describe how you can prove ownership (e.g., contract, license, etc.)"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactNumber">Contact Number</Label>
                          <Input
                            id="contactNumber"
                            value={claimForm.contactNumber}
                            onChange={(e) => setClaimForm({ ...claimForm, contactNumber: e.target.value })}
                            placeholder="+961 1 234567"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setClaimForm({ dormId: null, proof: '', contactNumber: '' })}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={claiming}
                            className="flex-1"
                          >
                            {claiming ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Claim'
                            )}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        onClick={() => setClaimForm({ dormId: dorm.id, proof: '', contactNumber: '' })}
                        className="w-full"
                      >
                        Claim This Dorm
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
