import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, User, CalendarClock } from 'lucide-react';
import { OwnerAvailabilityManager } from '@/components/owner/OwnerAvailabilityManager';
import { AcceptBookingModal } from '@/components/bookings/AcceptBookingModal';
import { MeetingLinkButton } from '@/components/bookings/MeetingLinkButton';
import { AddToCalendarDropdown } from '@/components/bookings/AddToCalendarDropdown';
import { sendTourSystemMessage } from '@/lib/tourMessaging';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { type MeetingPlatform } from '@/lib/meetingUtils';
import { motion } from 'framer-motion';

export function OwnerCalendarContent() {
  const { userId } = useAuthGuard();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string>('');
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');

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
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data: owner, error: ownerError } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (ownerError || !owner) {
        setLoading(false);
        return;
      }

      setOwnerId(owner.id);

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('owner_id', owner.id)
        .order('requested_date', { ascending: true });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load bookings',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

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
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (meetingLink: string, platform: MeetingPlatform, notes?: string) => {
    if (!selectedBooking) return;
    
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
        .eq('id', selectedBooking.id);

      if (error) throw error;

      const { data: student } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', selectedBooking.student_id)
        .single();

      if (student && userId) {
        await sendTourSystemMessage(
          student.user_id,
          userId,
          'accepted',
          {
            dormName: selectedBooking.dorms?.dorm_name || selectedBooking.dorms?.name,
            date: format(new Date(selectedBooking.requested_date), 'PPP'),
            time: selectedBooking.requested_time,
            meetingLink,
            platform,
            bookingId: selectedBooking.id
          }
        );

        await supabase.functions.invoke('schedule-booking-reminders', {
          body: { bookingId: selectedBooking.id }
        });
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="rounded-2xl animate-pulse">
            <CardContent className="p-6 h-64" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings" className="gap-2">
            <Clock className="w-4 h-4" />
            Tour Calendar
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <CalendarClock className="w-4 h-4" />
            Manage Availability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-2xl shadow-md">
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    {selectedDate ? selectedDate.toLocaleDateString() : 'Select a date'}
                  </h2>
                  
                  <div className="space-y-4">
                    {bookingsForSelectedDate.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No tours scheduled for this day
                      </p>
                    ) : (
                      bookingsForSelectedDate.map(booking => (
                        <Card key={booking.id} className="rounded-xl shadow-sm overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={booking.students?.profile_photo_url} />
                                <AvatarFallback className="bg-primary/10">
                                  <User className="w-5 h-5 text-primary" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{booking.students?.full_name}</h3>
                                <p className="text-sm text-muted-foreground">{booking.dorms?.dorm_name || booking.dorms?.name}</p>
                              </div>
                              <Badge variant={
                                booking.status === 'confirmed' ? 'default' :
                                booking.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              }>
                                {booking.status}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <Clock className="w-4 h-4" />
                              {booking.requested_time}
                            </div>

                            {booking.message && (
                              <p className="text-sm bg-muted p-2 rounded mb-3">
                                {booking.message}
                              </p>
                            )}

                            {booking.status === 'approved' && booking.meeting_link && (
                              <div className="flex flex-wrap gap-2">
                                <MeetingLinkButton
                                  meetingLink={booking.meeting_link}
                                  platform={booking.meeting_platform as MeetingPlatform}
                                  size="sm"
                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500"
                                />
                                <AddToCalendarDropdown
                                  booking={{
                                    id: booking.id,
                                    dorm_name: booking.dorms?.dorm_name || booking.dorms?.name,
                                    student_name: booking.students?.full_name,
                                    requested_date: booking.requested_date,
                                    requested_time: booking.requested_time,
                                    meeting_link: booking.meeting_link,
                                    meeting_platform: booking.meeting_platform
                                  }}
                                  size="sm"
                                />
                              </div>
                            )}

                            {booking.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setAcceptModalOpen(true);
                                  }}
                                  className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
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
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="availability">
          {ownerId && (
            <OwnerAvailabilityManager ownerId={ownerId} />
          )}
        </TabsContent>
      </Tabs>

      {selectedBooking && (
        <AcceptBookingModal
          open={acceptModalOpen}
          onOpenChange={setAcceptModalOpen}
          booking={{
            id: selectedBooking.id,
            student_name: selectedBooking.students?.full_name || 'Unknown Student',
            dorm_name: selectedBooking.dorms?.dorm_name || selectedBooking.dorms?.name || 'Unknown Dorm',
            requested_date: selectedBooking.requested_date,
            requested_time: selectedBooking.requested_time,
            message: selectedBooking.message
          }}
          onConfirm={handleAcceptBooking}
          loading={acceptLoading}
        />
      )}
    </div>
  );
}
