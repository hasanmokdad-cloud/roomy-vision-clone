import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ClipboardList, Clock, CalendarClock, CheckCircle } from 'lucide-react';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OwnerBreadcrumb } from '@/components/owner/OwnerBreadcrumb';
import { OwnerBookingsContent } from '@/components/owner/OwnerBookingsContent';
import { OwnerCalendarContent } from '@/components/owner/OwnerCalendarContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { supabase } from '@/integrations/supabase/client';

const OwnerScheduleHub = () => {
  const { userId } = useAuthGuard();
  const [ownerId, setOwnerId] = useState<string>('');
  const [stats, setStats] = useState({
    pendingCount: 0,
    upcomingCount: 0,
  });

  useEffect(() => {
    if (userId) {
      loadOwnerAndStats();
    }
  }, [userId]);

  const loadOwnerAndStats = async () => {
    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!owner) return;
    setOwnerId(owner.id);

    const today = new Date().toISOString().split('T')[0];

    const { count: pendingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', owner.id)
      .eq('status', 'pending');

    const { count: upcomingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', owner.id)
      .eq('status', 'approved')
      .gte('requested_date', today);

    setStats({
      pendingCount: pendingCount || 0,
      upcomingCount: upcomingCount || 0,
    });
  };

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <OwnerBreadcrumb items={[{ label: 'Tour Management' }]} />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tour Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your tour bookings, calendar, and availability
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pending Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-amber-600">{stats.pendingCount}</div>
                    {stats.pendingCount > 0 && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        Needs Action
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="glass-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Upcoming Tours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-green-600">{stats.upcomingCount}</div>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      Scheduled
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Booking Requests Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Booking Requests</h2>
            </div>
            <OwnerBookingsContent />
          </motion.div>

          {/* Calendar Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Calendar & Availability</h2>
            </div>
            <OwnerCalendarContent />
          </motion.div>
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerScheduleHub;
