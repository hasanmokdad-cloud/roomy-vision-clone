import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, CheckCircle } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/BottomNav';

export default function ClaimDorm() {
  const { loading: authLoading, userId } = useAuthGuard();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searching, setSearching] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState({
    dorm_name: '',
    phone_number: '',
    email: '',
  });

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
        query = query.ilike('dorm_name', `%${searchQuery.dorm_name}%`);
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

  const handleClaim = async (dormId: string) => {
    if (!userId) return;

    setClaiming(true);

    try {
      // Get owner ID
      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!owner) {
        throw new Error('Owner profile not found');
      }

      // Update dorm with owner_id
      const { error } = await supabase
        .from('dorms')
        .update({ owner_id: owner.id })
        .eq('id', dormId);

      if (error) throw error;

      toast({
        title: 'Dorm claimed successfully!',
        description: 'The dorm is now linked to your account.',
      });

      navigate('/dashboard/owner');
    } catch (error: any) {
      console.error('Error claiming dorm:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to claim dorm. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20 mb-20 md:mb-0">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/owner')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold gradient-text mb-4">Claim Your Dorm</h1>
          <p className="text-foreground/70 mb-8">
            Search for your existing dorm in our database and claim it to manage it from your dashboard.
          </p>

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

          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Search Results</h2>
              {searchResults.map((dorm) => (
                <Card key={dorm.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                    <Button
                      onClick={() => handleClaim(dorm.id)}
                      disabled={claiming}
                    >
                      {claiming ? 'Claiming...' : 'Claim This Dorm'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
