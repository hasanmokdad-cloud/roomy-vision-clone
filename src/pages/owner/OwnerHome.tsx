import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Eye, MessageCircle, TrendingUp, Home, LogOut, Plus, Clock, CheckCircle, Loader2, Pencil, Video } from 'lucide-react';
import { useOwnerDormsQuery } from '@/hooks/useOwnerDormsQuery';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DormForm } from '@/components/owner/DormForm';
import DormEditModal from '@/components/admin/DormEditModal';
import { NotificationBell } from '@/components/owner/NotificationBell';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function UpcomingToursWidget({ ownerId }: { ownerId: string }) {
  const navigate = useNavigate();
  const [tours, setTours] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTours();
    loadPendingCount();
  }, [ownerId]);

  const loadTours = async () => {
    // Fetch bookings without embedded relations
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('status', 'approved')
      .gte('requested_date', new Date().toISOString().split('T')[0])
      .order('requested_date', { ascending: true })
      .order('requested_time', { ascending: true })
      .limit(5);

    // Enrich with dorm and student data separately
    const enriched = await Promise.all((data || []).map(async (booking) => {
      const [dormResult, studentResult] = await Promise.all([
        supabase.from('dorms').select('dorm_name, name').eq('id', booking.dorm_id).maybeSingle(),
        supabase.from('students').select('full_name').eq('id', booking.student_id).maybeSingle()
      ]);
      
      return {
        ...booking,
        dorms: dormResult.data,
        students: studentResult.data
      };
    }));

    setTours(enriched);
    setLoading(false);
  };

  const loadPendingCount = async () => {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', ownerId)
      .eq('status', 'pending');

    setPendingCount(count || 0);
  };

  if (loading) {
    return (
      <Card className="glass-hover">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tours.length === 0) return null;

  return (
    <Card className="glass-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Upcoming Tours</h3>
            {pendingCount > 0 && (
              <Badge variant="default" className="bg-orange-500">
                {pendingCount} Pending
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/owner/calendar')}>
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {tours.map((tour) => (
            <div
              key={tour.id}
              className="p-4 bg-muted/20 rounded-lg border border-border/40"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{tour.students?.full_name}</h4>
                  <p className="text-sm text-foreground/60">
                    {tour.dorms?.dorm_name || tour.dorms?.name}
                  </p>
                </div>
                <Badge className="bg-green-500/20 text-green-700">Accepted</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-foreground/60 mb-3">
                <span>{format(new Date(tour.requested_date), 'PPP')}</span>
                <span>{tour.requested_time}</span>
              </div>
              {tour.meeting_link && (
                <Button
                  size="sm"
                  onClick={() => window.open(tour.meeting_link, '_blank')}
                  className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-500"
                >
                  <Video className="w-4 h-4" />
                  Join Meeting
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OwnerHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, role, loading: authLoading } = useRoleGuard('owner');
  const [ownerId, setOwnerId] = useState<string>();
  const { data: dorms, refetch: refetchDorms } = useOwnerDormsQuery(ownerId);
  const { count: unreadMessages } = useUnreadMessagesCount(userId, role);
  const [showAddDorm, setShowAddDorm] = useState(false);
  const [editingDorm, setEditingDorm] = useState<any | null>(null);
  const [stats, setStats] = useState({
    totalDorms: 0,
    verifiedDorms: 0,
    pendingDorms: 0,
    totalViews: 0,
  });

  useEffect(() => {
    if (userId) {
      loadOwnerId();
    }
  }, [userId]);

  // Subscribe to real-time verification status changes
  useEffect(() => {
    if (!ownerId) return;

    console.log('🔄 Setting up real-time subscription for ownerId:', ownerId);

    const channel = supabase
      .channel('dorm-verification-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dorms',
          filter: `owner_id=eq.${ownerId}`
        },
        (payload) => {
          console.log('🔔 Dorm updated:', payload);
          // Refetch dorms when verification status changes
          refetchDorms();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [ownerId, refetchDorms]);

  useEffect(() => {
    if (dorms) {
      const verified = dorms.filter(d => d.verification_status === 'Verified').length;
      const pending = dorms.filter(d => d.verification_status === 'Pending').length;
      
      // Fetch analytics for verified dorms
      const dormIds = dorms.filter(d => d.verification_status === 'Verified').map(d => d.id);
      if (dormIds.length > 0) {
        supabase
          .from('analytics_events')
          .select('type', { count: 'exact', head: true })
          .in('dorm_id', dormIds)
          .eq('type', 'view')
          .then(({ count }) => {
            setStats(prev => ({ ...prev, totalViews: count || 0 }));
          });
      }

      setStats(prev => ({
        ...prev,
        totalDorms: dorms.length,
        verifiedDorms: verified,
        pendingDorms: pending,
      }));
    }
  }, [dorms]);

  // Subscribe to real-time analytics events for views
  useEffect(() => {
    if (!dorms) return;

    const dormIds = dorms
      .filter(d => d.verification_status === 'Verified')
      .map(d => d.id);

    if (dormIds.length === 0) return;

    // Real-time subscription for new views
    const viewsChannel = supabase
      .channel('owner-views-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
          filter: `type=eq.view`
        },
        (payload) => {
          // Check if the new view is for one of this owner's dorms
          if (dormIds.includes(payload.new.dorm_id)) {
            setStats(prev => ({ ...prev, totalViews: prev.totalViews + 1 }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(viewsChannel);
    };
  }, [dorms]);

  const loadOwnerId = async () => {
    if (!userId) {
      console.log('❌ No userId, cannot load ownerId');
      return;
    }

    console.log('🔍 Loading ownerId for userId:', userId);
    
    // First verify the session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 Current Session:', {
      authenticated: !!session,
      user_id: session?.user?.id,
      matches_userId: session?.user?.id === userId,
      expires_at: session?.expires_at
    });
    
    const { data: owner, error } = await supabase
      .from('owners')
      .select('id, user_id, full_name, email')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('👤 Owner Query Result:', { owner, error });

    if (error) {
      console.error('❌ Error loading ownerId:', error);
      toast({
        title: "Error",
        description: "Failed to load owner information. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (owner) {
      console.log('✅ Loaded owner record:', owner);
      console.log('🆔 Setting ownerId to:', owner.id);
      setOwnerId(owner.id);
    } else {
      console.log('⚠️ No owner record found for userId:', userId);
      toast({
        title: "Account Setup Required",
        description: "Your owner account needs to be set up. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleDormSaved = () => {
    setShowAddDorm(false);
    refetchDorms();
  };

  const pendingDorms = dorms?.filter(d => d.verification_status === 'Pending') || [];
  const verifiedDorms = dorms?.filter(d => d.verification_status === 'Verified') || [];

  const statCards = [
    { title: 'Total Dorms', value: stats.totalDorms, icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { title: 'Total Views', value: stats.totalViews, icon: Eye, color: 'from-green-500 to-emerald-500' },
    { title: 'Messages', value: unreadMessages, icon: MessageCircle, color: 'from-purple-500 to-pink-500' },
    { title: 'Verified', value: stats.verifiedDorms, icon: CheckCircle, color: 'from-orange-500 to-red-500' },
  ];

  // Debug logging
  console.log('=== Owner Home Debug ===');
  console.log('showAddDorm:', showAddDorm);
  console.log('ownerId:', ownerId);
  console.log('dorms:', dorms);
  console.log('dorms?.length:', dorms?.length);
  console.log('!showAddDorm:', !showAddDorm);
  console.log('Should show button:', !showAddDorm);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h2 className="text-lg font-semibold">Owner Panel</h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/contact')}
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Reach Us
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {ownerId && <NotificationBell ownerId={ownerId} />}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Owner Control Panel</h1>
          <p className="text-foreground/60">
            Manage your listed dorms, chat with students, and view performance.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-hover rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Calendar & Availability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Tour Calendar</h3>
                  <p className="text-foreground/60">
                    View upcoming tour bookings and manage your schedule
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/owner/calendar')}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  View Calendar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Set Availability</h3>
                  <p className="text-foreground/60">
                    Block dates and times when you're not available
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/owner/calendar?tab=availability')}
                  variant="outline"
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Manage Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Tours Widget */}
        {ownerId && <UpcomingToursWidget ownerId={ownerId} />}

        {/* Add New Dorm Button */}
        {true && (
          <Card className="glass-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Add New Dorm</h3>
                  <p className="text-foreground/60">
                    Create a new dorm listing and add rooms to start receiving inquiries
                  </p>
                </div>
                {showAddDorm ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log('🔽 Hide Form clicked');
                      setShowAddDorm(false);
                    }}
                    className="gap-2"
                  >
                    Hide Form
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      console.log('🔼 Add New Dorm clicked, ownerId:', ownerId);
                      setShowAddDorm(true);
                    }}
                    disabled={!ownerId}
                    className="gap-2 bg-gradient-to-r from-primary to-secondary"
                  >
                    <Plus className="w-4 h-4" />
                    {ownerId ? 'Add New Dorm' : 'Loading...'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dorm Form */}
        {showAddDorm && (
          <Card className="glass-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Create New Dorm</h2>
                <Button variant="ghost" onClick={() => setShowAddDorm(false)}>
                  Cancel
                </Button>
              </div>
              {ownerId ? (
                <DormForm
                  ownerId={ownerId}
                  onSaved={handleDormSaved}
                  onCancel={() => setShowAddDorm(false)}
                />
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="ml-3 text-foreground/60">Loading owner information...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dorms Pending Verification */}
        {pendingDorms.length > 0 && (
          <Card className="glass-hover">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold">Dorms Pending Verification</h2>
                <Badge variant="secondary">{pendingDorms.length}</Badge>
              </div>
              <p className="text-sm text-foreground/60 mb-4">
                These dorms are awaiting admin approval. You'll be notified once they're verified.
              </p>
              <div className="space-y-3">
                {pendingDorms.map((dorm) => (
                  <div
                    key={dorm.id}
                    className="p-4 bg-muted/20 rounded-lg border border-border/40"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{dorm.dorm_name || dorm.name}</h4>
                        <p className="text-sm text-foreground/60 mt-1">
                          {dorm.area} • ${dorm.monthly_price || dorm.price}/mo
                        </p>
                        <p className="text-xs text-foreground/40 mt-1">
                          Submitted {new Date(dorm.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-orange-500 border-orange-500">
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Properties */}
        {verifiedDorms.length > 0 && (
          <Card className="glass-hover">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-bold">My Properties</h2>
                <Badge variant="secondary">{verifiedDorms.length}</Badge>
              </div>
              <div className="space-y-3">
                {verifiedDorms.map((dorm) => (
                  <div
                    key={dorm.id}
                    className="p-4 bg-muted/20 rounded-lg border border-border/40 hover:border-primary/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/owner/dorms/${dorm.id}/rooms`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{dorm.dorm_name || dorm.name}</h4>
                        <p className="text-sm text-foreground/60 mt-1">
                          {dorm.area} • From ${dorm.monthly_price || dorm.price}/mo
                        </p>
                        <p className="text-xs text-foreground/40 mt-1">
                          Verified {new Date(dorm.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          Verified
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDorm(dorm);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit Dorm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/owner/dorms/${dorm.id}/rooms`);
                            }}
                          >
                            Manage Rooms
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!showAddDorm && dorms?.length === 0 && (
          <Card className="glass-hover">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Dorms Yet</h3>
              <p className="text-foreground/60 mb-6">
                Get started by adding your first dorm listing
              </p>
              <Button
                onClick={() => setShowAddDorm(true)}
                className="gap-2 bg-gradient-to-r from-primary to-secondary"
              >
                <Plus className="w-4 h-4" />
                Add Your First Dorm
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dorm Modal */}
      {editingDorm && (
        <DormEditModal
          dorm={editingDorm}
          isOpen={!!editingDorm}
          onClose={() => setEditingDorm(null)}
          onUpdate={() => {
            setEditingDorm(null);
            refetchDorms();
          }}
          isAdmin={false}
        />
      )}
    </div>
  );
}
