import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Eye, MessageCircle, TrendingUp, Plus, Clock, CheckCircle, Loader2, Pencil, Video, Wallet } from 'lucide-react';
import { useOwnerDormsQuery } from '@/hooks/useOwnerDormsQuery';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import DormEditModal from '@/components/admin/DormEditModal';
import { NotificationBell } from '@/components/owner/NotificationBell';
import { PayoutSetupBanner } from '@/components/owner/PayoutSetupBanner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OwnerDashboardSkeleton } from '@/components/skeletons/OwnerSkeletons';

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
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('status', 'approved')
      .gte('requested_date', new Date().toISOString().split('T')[0])
      .order('requested_date', { ascending: true })
      .order('requested_time', { ascending: true })
      .limit(5);

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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#6D5BFF]" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (tours.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="transition-all"
    >
      <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-700">Upcoming Tours</h3>
              {pendingCount > 0 && (
                <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white">
                  {pendingCount} Pending
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/owner/calendar')}
              className="text-[#6D5BFF] hover:bg-[#f6f4ff]"
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-700">{tour.students?.full_name}</h4>
                    <p className="text-sm text-gray-500">
                      {tour.dorms?.dorm_name || tour.dorms?.name}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">Accepted</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span>{format(new Date(tour.requested_date), 'PPP')}</span>
                  <span>{tour.requested_time}</span>
                </div>
                {tour.meeting_link && (
                  <Button
                    size="sm"
                    onClick={() => window.open(tour.meeting_link, '_blank')}
                    className="w-full md:w-auto gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl"
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
    </motion.div>
  );
}

export default function OwnerHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, role, loading: authLoading } = useRoleGuard('owner');
  const [ownerId, setOwnerId] = useState<string>();
  const { data: dorms, refetch: refetchDorms } = useOwnerDormsQuery(ownerId);
  const { count: unreadMessages } = useUnreadMessagesCount(userId, role);
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

  useEffect(() => {
    if (!ownerId) return;

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
          refetchDorms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId, refetchDorms]);

  useEffect(() => {
    if (dorms) {
      const verified = dorms.filter(d => d.verification_status === 'Verified').length;
      const pending = dorms.filter(d => d.verification_status === 'Pending').length;
      
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

  useEffect(() => {
    if (!dorms) return;

    const dormIds = dorms
      .filter(d => d.verification_status === 'Verified')
      .map(d => d.id);

    if (dormIds.length === 0) return;

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
    if (!userId) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data: owner, error } = await supabase
      .from('owners')
      .select('id, user_id, full_name, email')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load owner information. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (owner) {
      setOwnerId(owner.id);
    } else {
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


  const pendingDorms = dorms?.filter(d => d.verification_status === 'Pending') || [];
  const verifiedDorms = dorms?.filter(d => d.verification_status === 'Verified') || [];

  const statCards = [
    { title: 'Total Dorms', value: stats.totalDorms, icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { title: 'Total Views', value: stats.totalViews, icon: Eye, color: 'from-green-500 to-emerald-500' },
    { title: 'Messages', value: unreadMessages, icon: MessageCircle, color: 'from-purple-500 to-pink-500' },
    { title: 'Verified', value: stats.verifiedDorms, icon: CheckCircle, color: 'from-orange-500 to-red-500' },
  ];

  if (authLoading) {
    return <OwnerDashboardSkeleton />;
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8 overflow-auto pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-blue-700">Owner Control Panel</h1>
            <p className="text-gray-500 text-sm">
              Manage your listed dorms, chat with students, and view performance.
            </p>
          </div>

          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {statCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl shadow-md p-5 bg-white hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-700">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Payout Setup Banner - Full Width */}
          {ownerId && <PayoutSetupBanner ownerId={ownerId} />}

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Tour Calendar',
                description: 'View tour bookings and manage your availability',
                icon: Clock,
                action: () => navigate('/owner/calendar'),
                buttonText: 'Open Calendar',
                variant: 'primary' as const,
              },
              {
                title: 'Your Earnings',
                description: 'Track reservations payouts and revenue',
                icon: TrendingUp,
                action: () => navigate('/owner/earnings'),
                buttonText: 'View Earnings',
                variant: 'outline' as const,
              },
              {
                title: 'Refund Requests',
                description: 'Review and manage student refund requests',
                icon: Clock,
                action: () => navigate('/owner/refunds'),
                buttonText: 'View Requests',
                variant: 'outline' as const,
              },
              {
                title: 'Wallet & Payouts',
                description: 'Manage your payout card and view transactions',
                icon: Wallet,
                action: () => navigate('/owner/wallet'),
                buttonText: 'Open Wallet',
                variant: 'primary' as const,
              },
            ].map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="rounded-xl shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">{card.title}</h3>
                        <p className="text-gray-500 text-sm">{card.description}</p>
                      </div>
                      <Button
                        onClick={card.action}
                        variant={card.variant === 'outline' ? 'outline' : 'default'}
                        className={`w-full md:w-auto gap-2 ${
                          card.variant === 'primary' 
                            ? 'bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF] text-white rounded-xl hover:opacity-90' 
                            : 'rounded-xl'
                        }`}
                      >
                        <card.icon className="w-4 h-4" />
                        {card.buttonText}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Upcoming Tours Widget */}
          {ownerId && <UpcomingToursWidget ownerId={ownerId} />}


          {/* Pending Dorms */}
          {pendingDorms.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700">Pending Verification</h2>
              <div className="grid gap-4">
                {pendingDorms.map((dorm, index) => (
                  <motion.div
                    key={dorm.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="rounded-xl shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold text-gray-700">{dorm.dorm_name || dorm.name}</h3>
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600">Pending Review</Badge>
                            </div>
                            <p className="text-gray-500 text-sm">
                              {dorm.area || dorm.location} • From ${dorm.monthly_price || dorm.price}/month
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDorm(dorm)}
                            className="gap-2 rounded-xl"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Dorms */}
          {verifiedDorms.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700">Your Verified Dorms</h2>
              <div className="grid gap-4">
                {verifiedDorms.map((dorm, index) => (
                  <motion.div
                    key={dorm.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="rounded-xl shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold text-gray-700">{dorm.dorm_name || dorm.name}</h3>
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            </div>
                            <p className="text-gray-500 text-sm">
                              {dorm.area || dorm.location} • From ${dorm.monthly_price || dorm.price}/month
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/owner/rooms')}
                              className="rounded-xl"
                            >
                              Manage Rooms
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingDorm(dorm)}
                              className="rounded-xl"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dorm Modal */}
      {editingDorm && (
        <DormEditModal
          dorm={editingDorm}
          isOpen={true}
          onClose={() => setEditingDorm(null)}
          onUpdate={() => {
            setEditingDorm(null);
            refetchDorms();
          }}
        />
      )}
    </OwnerLayout>
  );
}
