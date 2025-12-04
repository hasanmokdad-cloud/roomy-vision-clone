import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import Navbar from '@/components/shared/Navbar';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import BottomNav from '@/components/BottomNav';
import { sendOwnerNotification } from '@/utils/analytics';
import { AcceptBookingModal } from '@/components/bookings/AcceptBookingModal';
import { MeetingLinkButton } from '@/components/bookings/MeetingLinkButton';
import { AddToCalendarDropdown } from '@/components/bookings/AddToCalendarDropdown';
import { sendTourSystemMessage } from '@/lib/tourMessaging';
import { type MeetingPlatform } from '@/lib/meetingUtils';

type Booking = {
  id: string;
  dorm_id: string;
  student_id: string;
  requested_date: string;
  requested_time: string;
  status: string;
  message: string | null;
  owner_notes: string | null;
  meeting_link: string | null;
  meeting_platform: string | null;
  created_at: string;
  dorm_name?: string;
  student_name?: string;
};

export default function OwnerBookings() {
  const { loading: authLoading } = useAuthGuard();
  const { loading: roleLoading } = useRoleGuard('owner');
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [ownerNotes, setOwnerNotes] = useState('');
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [bookingToAccept, setBookingToAccept] = useState<Booking | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const { userId } = useAuthGuard();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      loadBookings();
      subscribeToBookings();
    }
  }, [authLoading, roleLoading]);

  const subscribeToBookings = () => {
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        loadBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!owner) return;

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('owner_id', owner.id)
        .order('requested_date', { ascending: true })
        .order('requested_time', { ascending: true });

      if (error) throw error;

      // Enrich with dorm and student names
      const enriched = await Promise.all((data || []).map(async (booking) => {
        const { data: dorm } = await supabase
          .from('dorms')
          .select('name, dorm_name')
          .eq('id', booking.dorm_id)
          .single();

        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('full_name, email')
          .eq('id', booking.student_id)
          .single();

        if (studentError) {
          console.error('Error fetching student:', studentError);
        }

        return {
          ...booking,
          dorm_name: dorm?.dorm_name || dorm?.name || 'Unknown Dorm',
          student_name: student?.full_name || 'Unknown Student',
          student_email: student?.email || ''
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

  const handleApprove = async (meetingLink: string, platform: MeetingPlatform, notes?: string) => {
    if (!bookingToAccept) return;

    setAcceptLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'approved',
          meeting_link: meetingLink,
          meeting_platform: platform,
          owner_notes: notes || null
        })
        .eq('id', bookingToAccept.id);

      if (error) throw error;

      // Get student user_id for messaging
      const { data: student } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', bookingToAccept.student_id)
        .single();

      if (student && userId) {
        // Send system message
        await sendTourSystemMessage(
          student.user_id,
          userId,
          'accepted',
          {
            dormName: bookingToAccept.dorm_name || 'the property',
            date: format(new Date(bookingToAccept.requested_date), 'PPP'),
            time: bookingToAccept.requested_time,
            meetingLink,
            platform
          }
        );
      }

      // Send notification to owner
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: owner } = await supabase
          .from('owners')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (owner && bookingToAccept.dorm_id) {
          await sendOwnerNotification({
            ownerId: owner.id,
            dormId: bookingToAccept.dorm_id,
            event: 'booking_approved',
            message: `Viewing request approved for ${bookingToAccept.student_name}`
          });
        }
      }

      toast({
        title: 'Viewing Approved',
        description: 'The student has been notified with the meeting link'
      });

      setAcceptModalOpen(false);
      setBookingToAccept(null);
      setSelectedBooking(null);
      setOwnerNotes('');
      loadBookings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleDecline = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'declined',
          owner_notes: ownerNotes.trim() || null
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Get student user_id for messaging
      const { data: student } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', booking.student_id)
        .single();

      if (student && userId) {
        await sendTourSystemMessage(
          student.user_id,
          userId,
          'declined',
          {
            dormName: booking.dorm_name || 'the property',
            date: format(new Date(booking.requested_date), 'PPP'),
            time: booking.requested_time,
            reason: ownerNotes.trim() || undefined
          }
        );
      }

      // Send notification to owner
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: owner } = await supabase
          .from('owners')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (owner && booking.dorm_id) {
          await sendOwnerNotification({
            ownerId: owner.id,
            dormId: booking.dorm_id,
            event: 'booking_declined',
            message: `Viewing request declined for ${booking.student_name}`
          });
        }
      }

      toast({
        title: 'Viewing Declined',
        description: 'The viewing request has been declined'
      });

      setSelectedBooking(null);
      setOwnerNotes('');
      loadBookings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'default',
      approved: 'default',
      declined: 'destructive',
      cancelled: 'secondary',
      completed: 'default'
    };

    return (
      <Badge variant={variants[status]} className={
        status === 'approved' ? 'bg-green-500' : 
        status === 'completed' ? 'bg-blue-500' : ''
      }>
        {status === 'approved' ? 'Accepted' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const upcomingBookings = bookings.filter(b => b.status === 'approved');
  const pastBookings = bookings.filter(b => ['declined', 'cancelled', 'completed'].includes(b.status));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background w-full">
        <Navbar />
        <div className="flex-1 flex pt-20">
          {!isMobile && <OwnerSidebar />}
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Viewing Requests</h1>
                <p className="text-muted-foreground">Manage student viewing requests</p>
              </div>

            {/* Pending Requests */}
            <section>
              <h2 className="text-xl font-semibold mb-4">
                Pending Requests ({pendingBookings.length})
              </h2>
              <div className="grid gap-4">
                {pendingBookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No pending requests
                    </CardContent>
                  </Card>
                ) : (
                  pendingBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{booking.student_name}</span>
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {booking.dorm_name}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                {format(new Date(booking.requested_date), 'PPP')}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                {booking.requested_time}
                              </div>
                            </div>
                            {booking.message && (
                              <div className="flex items-start gap-2 text-sm bg-muted p-3 rounded-lg">
                                <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                                <p>{booking.message}</p>
                              </div>
                            )}
                            {selectedBooking === booking.id && (
                              <div className="space-y-2">
                                <Textarea
                                  value={ownerNotes}
                                  onChange={(e) => setOwnerNotes(e.target.value)}
                                  placeholder="Add notes (optional)..."
                                  rows={2}
                                  maxLength={500}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex md:flex-col gap-2">
                            {selectedBooking === booking.id ? (
                              <>
                                <Button
                                  onClick={() => {
                                    setBookingToAccept(booking);
                                    setAcceptModalOpen(true);
                                  }}
                                  className="flex-1 md:flex-none"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirm Approve
                                </Button>
                                <Button
                                  onClick={() => handleDecline(booking.id)}
                                  variant="destructive"
                                  className="flex-1 md:flex-none"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Confirm Decline
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSelectedBooking(null);
                                    setOwnerNotes('');
                                  }}
                                  variant="outline"
                                  className="flex-1 md:flex-none"
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  onClick={() => setSelectedBooking(booking.id)}
                                  className="flex-1 md:flex-none"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => setSelectedBooking(booking.id)}
                                  variant="outline"
                                  className="flex-1 md:flex-none"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Decline
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>

            {/* Upcoming Viewings */}
            <section>
              <h2 className="text-xl font-semibold mb-4">
                Upcoming Viewings ({upcomingBookings.length})
              </h2>
              <div className="grid gap-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{booking.student_name}</span>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {booking.dorm_name}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {format(new Date(booking.requested_date), 'PPP')}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            {booking.requested_time}
                          </div>
                        </div>
                        {booking.owner_notes && (
                          <div className="text-sm bg-muted p-3 rounded-lg">
                            <p className="font-medium mb-1">Your notes:</p>
                            <p>{booking.owner_notes}</p>
                          </div>
                        )}
                        {(booking as any).meeting_link && (
                          <div className="flex flex-wrap gap-2">
                            <MeetingLinkButton
                              meetingLink={(booking as any).meeting_link}
                              platform={(booking as any).meeting_platform as MeetingPlatform}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500"
                            />
                            <AddToCalendarDropdown
                              booking={{
                                ...booking,
                                meeting_link: (booking as any).meeting_link
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">
                  Past Requests ({pastBookings.length})
                </h2>
                <div className="grid gap-4">
                  {pastBookings.map((booking) => (
                    <Card key={booking.id} className="opacity-75">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{booking.student_name}</span>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {booking.dorm_name}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(booking.requested_date), 'PPP')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {booking.requested_time}
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
      {isMobile && <BottomNav />}
      
      {/* Accept Booking Modal */}
      {bookingToAccept && (
        <AcceptBookingModal
          open={acceptModalOpen}
          onOpenChange={setAcceptModalOpen}
          booking={bookingToAccept}
          onConfirm={handleApprove}
          loading={acceptLoading}
        />
      )}
    </div>
  </SidebarProvider>
  );
}
