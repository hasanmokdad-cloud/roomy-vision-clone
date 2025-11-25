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
import { Clock, User, CalendarClock } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { OwnerAvailabilityManager } from '@/components/owner/OwnerAvailabilityManager';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function OwnerCalendar() {
  const { userId } = useAuthGuard();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string>('');
  const defaultTab = searchParams.get('tab') || 'bookings';

  useEffect(() => {
    if (!userId) return;
    loadBookings();

    const channel = supabase
      .channel('tour_bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tour_bookings' },
        () => loadBookings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadBookings = async () => {
    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!owner) return;

    setOwnerId(owner.id);

    const { data } = await supabase
      .from('tour_bookings')
      .select(`
        *,
        dorms(dorm_name, name),
        students(full_name, email, profile_photo_url)
      `)
      .eq('owner_id', owner.id)
      .order('scheduled_time', { ascending: true });

    setBookings(data || []);
    setLoading(false);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await supabase
      .from('tour_bookings')
      .update({ status })
      .eq('id', bookingId);

    loadBookings();
  };

  const bookingsForSelectedDate = bookings.filter(b => {
    if (!selectedDate) return false;
    const bookingDate = new Date(b.scheduled_time);
    return bookingDate.toDateString() === selectedDate.toDateString();
  });

  const datesWithBookings = bookings.map(b => new Date(b.scheduled_time));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background w-full">
        <Navbar />
        <div className="flex-1 flex mt-16">
          <OwnerSidebar />
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
                            {new Date(booking.scheduled_time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>

                          {booking.student_message && (
                            <p className="text-sm bg-muted p-2 rounded mb-3">
                              {booking.student_message}
                            </p>
                          )}

                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                className="flex-1"
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                className="flex-1"
                              >
                                Cancel
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
    </div>
    </SidebarProvider>
  );
}
