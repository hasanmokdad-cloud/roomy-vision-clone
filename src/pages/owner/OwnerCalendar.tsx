import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, User, CalendarClock, Video } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { OwnerAvailabilityManager } from '@/components/owner/OwnerAvailabilityManager';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AcceptBookingModal } from '@/components/bookings/AcceptBookingModal';
import { sendTourSystemMessage } from '@/lib/tourMessaging';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function OwnerCalendar() {
  const { userId } = useAuthGuard();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string>('');
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const defaultTab = searchParams.get('tab') || 'bookings';

  useEffect(() => {
    if (!userId) return;
    loadBookings();

    const channel = supabase
      .channel('bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => loadBookings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadBookings = async () => {
    if (!userId) {
      console.log('No userId, cannot load bookings');
      return;
    }
    
    setLoading(true);
    try {
      const { data: owner, error: ownerError } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (ownerError || !owner) {
        console.error('Owner lookup error:', ownerError);
        setLoading(false);
        return;
      }

      setOwnerId(owner.id);
      console.log('Fetching bookings for owner:', owner.id);

      // Fetch bookings without embedded relations
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('owner_id', owner.id)
        .order('requested_date', { ascending: true });

      if (error) {
        console.error('Bookings query error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load bookings',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      console.log('Bookings fetched:', data?.length, data);

      // Enrich with dorm and student data separately
      const enriched = await Promise.all((data || []).map(async (booking) => {
        const [dormResult, studentResult] = await Promise.all([
          supabase.from('dorms').select('dorm_name, name').eq('id', booking.dorm_id).maybeSingle(),
          supabase.from('students').select('full_name, email, profile_photo_url').eq('id', booking.student_id).maybeSingle()
        ]);
        
        return {
          ...booking,
          dorms: dormResult.data,
          students: studentResult.data
        };
      }));

      setBookings(enriched);
    } catch (error) {
      console.error('Error in loadBookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    loadBookings();
  };

  const handleAcceptBooking = async (meetingLink: string, notes?: string) => {
    if (!selectedBooking) return;
    
    setAcceptLoading(true);
    try {
      // Update booking with meeting link
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'accepted',
          meeting_link: meetingLink,
          owner_notes: notes || null
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Get student user_id for messaging
      const { data: student } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', selectedBooking.student_id)
        .single();

      if (student && userId) {
        // Send system message
        await sendTourSystemMessage(
          student.user_id,
          userId,
          'accepted',
          {
            dormName: selectedBooking.dorms?.dorm_name || selectedBooking.dorms?.name,
            date: format(new Date(selectedBooking.requested_date), 'PPP'),
            time: selectedBooking.requested_time,
            meetingLink
          }
        );
      }

      toast({
        title: 'Tour Accepted',
        description: 'The student has been notified with the meeting link'
      });

      setAcceptModalOpen(false);
      setSelectedBooking(null);
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

  const handleDeclineBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    try {
      await supabase
        .from('bookings')
        .update({ status: 'declined' })
        .eq('id', bookingId);

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
            dormName: booking.dorms?.dorm_name || booking.dorms?.name,
            date: format(new Date(booking.requested_date), 'PPP'),
            time: booking.requested_time
          }
        );
      }

      toast({
        title: 'Tour Declined',
        description: 'The student has been notified'
      });

      loadBookings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const bookingsForSelectedDate = bookings.filter(b => {
    if (!selectedDate) return false;
    const bookingDate = new Date(b.requested_date);
    return bookingDate.toDateString() === selectedDate.toDateString();
  });

  const datesWithBookings = bookings.map(b => new Date(b.requested_date));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background w-full">
        <Navbar />
        <div className="flex-1 flex mt-16">
          <OwnerSidebar hiddenItems={['Bookings', 'Tour Calendar', 'Reviews', 'Add New Dorm', 'Bulk Import', 'Statistics', 'Account']} />
          <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Calendar & Availability</h1>

            <Tabs defaultValue={defaultTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="bookings" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Tour Bookings
                </TabsTrigger>
                <TabsTrigger value="availability" className="gap-2">
                  <CalendarClock className="w-4 h-4" />
                  Manage Availability
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    booked: datesWithBookings
                  }}
                  modifiersClassNames={{
                    booked: "bg-primary/20 font-bold"
                  }}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedDate ? selectedDate.toLocaleDateString() : 'Select a date'}
                </h2>
                
                <div className="space-y-4">
                  {bookingsForSelectedDate.length === 0 ? (
                    <p className="text-center text-foreground/60 py-8">
                      No tours scheduled for this day
                    </p>
                  ) : (
                    bookingsForSelectedDate.map(booking => (
                      <Card key={booking.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={booking.students?.profile_photo_url} />
                              <AvatarFallback className="bg-primary/10">
                                <User className="w-5 h-5 text-primary" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold">{booking.students?.full_name}</h3>
                              <p className="text-sm text-foreground/60">{booking.dorms?.dorm_name || booking.dorms?.name}</p>
                            </div>
                            <Badge variant={
                              booking.status === 'confirmed' ? 'default' :
                              booking.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            }>
                              {booking.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-foreground/60 mb-3">
                            <Clock className="w-4 h-4" />
                            {booking.requested_time}
                          </div>

                          {booking.message && (
                            <p className="text-sm bg-muted p-2 rounded mb-3">
                              {booking.message}
                            </p>
                          )}

                          {booking.status === 'accepted' && booking.meeting_link && (
                            <Button
                              size="sm"
                              onClick={() => window.open(booking.meeting_link, '_blank')}
                              className="w-full mb-2 gap-2 bg-gradient-to-r from-green-600 to-emerald-500"
                            >
                              <Video className="w-4 h-4" />
                              Join Meeting
                            </Button>
                          )}

                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setAcceptModalOpen(true);
                                }}
                                className="flex-1"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeclineBooking(booking.id)}
                                className="flex-1"
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
                </div>
              </TabsContent>

               <TabsContent value="availability">
                {ownerId && (
                  <OwnerAvailabilityManager ownerId={ownerId} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Accept Booking Modal */}
      {selectedBooking && (
        <AcceptBookingModal
          open={acceptModalOpen}
          onOpenChange={setAcceptModalOpen}
          booking={selectedBooking}
          onConfirm={handleAcceptBooking}
          loading={acceptLoading}
        />
      )}
    </div>
    </SidebarProvider>
  );
}
