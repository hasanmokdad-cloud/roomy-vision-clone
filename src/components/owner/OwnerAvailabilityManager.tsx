import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Lock, Unlock, Calendar as CalendarIcon } from 'lucide-react';

interface OwnerAvailabilityManagerProps {
  ownerId: string;
  dormId?: string;
}

interface BlockedDate {
  id: string;
  blocked_date: string;
  blocked_time_start: string | null;
  blocked_time_end: string | null;
  all_day: boolean;
  reason: string | null;
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00'
];

export function OwnerAvailabilityManager({ ownerId, dormId }: OwnerAvailabilityManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load blocked dates
  useEffect(() => {
    loadBlockedDates();
  }, [ownerId, dormId]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('owner-availability')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'owner_availability',
          filter: dormId ? `dorm_id=eq.${dormId}` : undefined,
        },
        () => {
          loadBlockedDates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId, dormId]);

  const loadBlockedDates = async () => {
    let query = supabase
      .from('owner_availability')
      .select('*')
      .eq('owner_id', ownerId);

    if (dormId) {
      query = query.eq('dorm_id', dormId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading blocked dates:', error);
      return;
    }

    setBlockedDates(data || []);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
    setAllDay(true);
    setReason('');
  };

  const handleBlockDate = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('owner_availability').insert({
        owner_id: ownerId,
        dorm_id: dormId || null,
        blocked_date: format(selectedDate, 'yyyy-MM-dd'),
        blocked_time_start: allDay ? null : startTime,
        blocked_time_end: allDay ? null : endTime,
        all_day: allDay,
        reason: reason.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Date Blocked',
        description: `${format(selectedDate, 'PPP')} has been marked as unavailable.`,
      });

      setModalOpen(false);
      loadBlockedDates();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockDate = async (id: string) => {
    const { error } = await supabase
      .from('owner_availability')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Date Unblocked',
      description: 'This date is now available for bookings.',
    });

    loadBlockedDates();
  };

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blockedDates.some((bd) => bd.blocked_date === dateStr);
  };

  const getBlockedDatesForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return blockedDates.filter((bd) => bd.blocked_date === dateStr);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Manage Availability
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on dates to block them from tour bookings
          </p>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            onDayClick={handleDateClick}
            className="rounded-md border"
            modifiers={{
              blocked: (date) => isDateBlocked(date),
            }}
            modifiersStyles={{
              blocked: {
                backgroundColor: 'hsl(var(--destructive) / 0.2)',
                color: 'hsl(var(--destructive))',
                fontWeight: 'bold',
              },
            }}
          />

          {/* Legend */}
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive" />
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-background border border-border" />
              <span>Available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Dates List */}
      {blockedDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blocked Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {blockedDates.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {format(new Date(blocked.blocked_date), 'PPP')}
                  </p>
                  {blocked.all_day ? (
                    <Badge variant="secondary" className="mt-1">All Day</Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-1">
                      {blocked.blocked_time_start} - {blocked.blocked_time_end}
                    </Badge>
                  )}
                  {blocked.reason && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {blocked.reason}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUnblockDate(blocked.id)}
                >
                  <Unlock className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Block Date Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Date</DialogTitle>
            <DialogDescription>
              Mark this date as unavailable for tour bookings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <p className="text-lg font-medium mt-1">
                {selectedDate && format(selectedDate, 'PPP')}
              </p>
            </div>

            {/* Existing blocks for this date */}
            {getBlockedDatesForSelectedDate().length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Already blocked:</p>
                {getBlockedDatesForSelectedDate().map((bd) => (
                  <Badge key={bd.id} variant="secondary" className="mr-2">
                    {bd.all_day ? 'All Day' : `${bd.blocked_time_start} - ${bd.blocked_time_end}`}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="all-day">Block all day</Label>
              <Switch
                id="all-day"
                checked={allDay}
                onCheckedChange={setAllDay}
              />
            </div>

            {!allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>End Time</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Personal time off, maintenance scheduled..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBlockDate}
                disabled={loading}
                className="flex-1"
              >
                <Lock className="w-4 h-4 mr-2" />
                {loading ? 'Blocking...' : 'Block Date'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
