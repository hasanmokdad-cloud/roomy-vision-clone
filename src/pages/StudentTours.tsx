import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

import { MeetingLinkButton } from '@/components/bookings/MeetingLinkButton';
import { AddToCalendarDropdown } from '@/components/bookings/AddToCalendarDropdown';
import { sendTourSystemMessage } from '@/lib/tourMessaging';
import { type MeetingPlatform } from '@/lib/meetingUtils';
import { SwipeableSubPage } from '@/components/mobile/SwipeableSubPage';
import { SubPageHeader } from '@/components/mobile/SubPageHeader';

type TourBooking = {
  id: string;
  dorm_id: string;
  owner_id: string;
  requested_date: string;
  requested_time: string;
  status: string;
  message: string | null;
  meeting_link: string | null;
  meeting_platform: string | null;
  created_at: string;
  dorm_name?: string;
  dorm_image?: string;
  dorm_location?: string;
  owner_user_id?: string;
};

export default function StudentTours() {
  const { userId, loading: authLoading } = useAuthGuard();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && userId) {
      loadTours();
      subscribeToTours();
    }
  }, [authLoading, userId]);

  const subscribeToTours = () => {
    const channel = supabase
      .channel('student-tours-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        loadTours();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadTours = async () => {
    try {
      if (!userId) return;

      // Get student ID
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!student) return;

      // Fetch all bookings for this student
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', student.id)
        .order('requested_date', { ascending: true })
        .order('requested_time', { ascending: true });

      if (error) throw error;

      // Enrich with dorm info
      const enriched: TourBooking[] = await Promise.all((data || []).map(async (booking) => {
        const { data: dorm } = await supabase
          .from('dorms')
          .select('name, dorm_name, cover_image, image_url, location, area, owner_id')
          .eq('id', booking.dorm_id)
          .single();

        // Get owner user_id for messaging
        const { data: owner } = await supabase
          .from('owners')
          .select('user_id')
          .eq('id', booking.owner_id)
          .single();

        return {
          ...booking,
          meeting_link: booking.meeting_link,
          dorm_name: dorm?.dorm_name || dorm?.name,
          dorm_image: dorm?.cover_image || dorm?.image_url,
          dorm_location: dorm?.area || dorm?.location,
          owner_user_id: owner?.user_id
        };
      }));

      setBookings(enriched);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (booking: TourBooking) => {
    setCancelling(booking.id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled_by_student' })
        .eq('id', booking.id);

      if (error) throw error;

      // Send system message
      if (booking.owner_user_id && userId) {
        await sendTourSystemMessage(
          userId,
          booking.owner_user_id,
          'cancelled',
          {
            dormName: booking.dorm_name || 'the property',
            date: format(new Date(booking.requested_date), 'PPP'),
            time: booking.requested_time
          }
        );
      }

      toast({
        title: 'Tour Cancelled',
        description: 'Your tour request has been cancelled'
      });

      loadTours();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; className: string }> = {
      pending: { variant: 'default', className: 'bg-yellow-500/20 text-yellow-700' },
      approved: { variant: 'default', className: 'bg-green-500/20 text-green-700' },
      declined: { variant: 'destructive', className: '' },
      cancelled_by_student: { variant: 'secondary', className: '' },
      cancelled_by_owner: { variant: 'secondary', className: '' },
      completed: { variant: 'default', className: 'bg-blue-500/20 text-blue-700' }
    };

    const { variant, className } = config[status] || config.pending;

    return (
      <Badge variant={variant} className={className}>
        {status === 'approved' ? 'Accepted' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcomingTours = bookings.filter(b => 
    (b.status === 'pending' || b.status === 'approved') &&
    new Date(`${b.requested_date}T${b.requested_time}`) > new Date()
  );

  const pastTours = bookings.filter(b => 
    b.status === 'completed' ||
    b.status === 'declined' ||
    b.status.includes('cancelled') ||
    new Date(`${b.requested_date}T${b.requested_time}`) <= new Date()
  );

  return (
    <SwipeableSubPage enabled={isMobile}>
    <div className="min-h-screen bg-background">
      {isMobile && <SubPageHeader title="My Tours" />}
      {!isMobile && <RoomyNavbar />}
      <main className={`${isMobile ? 'pt-20 pb-20' : 'pt-16'}`}>
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Tours</h1>
            <p className="text-muted-foreground">Manage your virtual tour bookings</p>
          </div>

          {/* Upcoming Tours */}
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Upcoming Tours ({upcomingTours.length})
            </h2>
            <div className="space-y-4">
              {upcomingTours.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No upcoming tours. Browse dorms and book a tour!
                  </CardContent>
                </Card>
              ) : (
                upcomingTours.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Dorm Image */}
                        {booking.dorm_image && (
                          <img
                            src={booking.dorm_image}
                            alt={booking.dorm_name}
                            className="w-full md:w-32 h-32 object-cover rounded-lg"
                          />
                        )}

                        {/* Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg">{booking.dorm_name}</h3>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {booking.dorm_location}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              {format(new Date(booking.requested_date), 'PPP')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              {booking.requested_time}
                            </div>
                          </div>

                          {booking.message && (
                            <p className="text-sm text-muted-foreground italic">
                              Your note: "{booking.message}"
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-2">
                            {booking.status === 'approved' && booking.meeting_link && (
                              <div className="flex flex-wrap gap-2 w-full">
                                <MeetingLinkButton
                                  meetingLink={booking.meeting_link}
                                  platform={booking.meeting_platform as MeetingPlatform}
                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500"
                                />
                                <AddToCalendarDropdown
                                  booking={{
                                    ...booking,
                                    owner_name: 'Property Owner'
                                  }}
                                />
                              </div>
                            )}
                            {(booking.status === 'pending' || booking.status === 'approved') && (
                              <Button
                                variant="outline"
                                onClick={() => handleCancel(booking)}
                                disabled={cancelling === booking.id}
                                className="gap-2"
                              >
                                {cancelling === booking.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Cancel Tour
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Past Tours */}
          {pastTours.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">
                Past Tours ({pastTours.length})
              </h2>
              <div className="space-y-4">
                {pastTours.map((booking) => (
                  <Card key={booking.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        {booking.dorm_image && (
                          <img
                            src={booking.dorm_image}
                            alt={booking.dorm_name}
                            className="w-full md:w-32 h-32 object-cover rounded-lg"
                          />
                        )}

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold">{booking.dorm_name}</h3>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {booking.dorm_location}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(booking.requested_date), 'PPP')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {booking.requested_time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      
    </div>
    </SwipeableSubPage>
  );
}
