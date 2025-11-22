import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { logAnalyticsEvent, sendOwnerNotification, triggerRecommenderTraining } from '@/utils/analytics';
import { useBookingConflicts } from '@/hooks/useBookingConflicts';
import { AvailabilityIndicator } from './AvailabilityIndicator';
import { AlternativeSlots } from './AlternativeSlots';

interface BookingRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dormId: string;
  dormName: string;
  ownerId: string;
}

export function BookingRequestModal({ open, onOpenChange, dormId, dormName, ownerId }: BookingRequestModalProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const { checking, lastCheck, checkAvailability } = useBookingConflicts(ownerId, dormId);

  // Check availability when date/time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const timer = setTimeout(() => {
        checkAvailability(selectedDate, selectedTime);
      }, 500); // Debounce for 500ms
      return () => clearTimeout(timer);
    }
  }, [selectedDate, selectedTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and time',
        variant: 'destructive'
      });
      return;
    }

    // Final conflict check
    const conflictCheck = await checkAvailability(selectedDate, selectedTime);
    if (!conflictCheck.isAvailable) {
      setShowAlternatives(true);
      toast({
        title: 'Time Slot Unavailable',
        description: 'This time slot is no longer available. Please select an alternative.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user's student ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) throw new Error('Student profile not found');

      const { error } = await supabase.from('bookings').insert({
        dorm_id: dormId,
        student_id: student.id,
        owner_id: ownerId,
        requested_date: format(selectedDate, 'yyyy-MM-dd'),
        requested_time: selectedTime,
        message: message.trim() || null
      });

      if (error) throw error;

      // Log booking request
      await logAnalyticsEvent({
        eventType: 'booking_request',
        userId: user.id,
        dormId: dormId,
        metadata: { 
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime
        }
      });

      // Send notification to owner
      await sendOwnerNotification({
        ownerId: ownerId,
        dormId: dormId,
        event: 'new_booking',
        message: `New viewing request for ${dormName}`
      });

      // Trigger recommender training
      await triggerRecommenderTraining(user.id);

      toast({
        title: 'Viewing Requested',
        description: 'Your viewing request has been sent to the owner'
      });

      onOpenChange(false);
      setSelectedDate(undefined);
      setSelectedTime('');
      setMessage('');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Viewing</DialogTitle>
          <DialogDescription>
            Schedule a viewing for {dormName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Select Date</Label>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Select Time
            </Label>
            <div className="flex gap-2">
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
                className="flex-1"
              />
              {selectedDate && selectedTime && (
                <AvailabilityIndicator
                  isAvailable={lastCheck?.isAvailable ?? null}
                  conflictType={lastCheck?.conflictType}
                  isChecking={checking}
                />
              )}
            </div>
          </div>

          {/* Show alternatives if slot is unavailable */}
          {showAlternatives && selectedDate && !lastCheck?.isAvailable && (
            <AlternativeSlots
              date={selectedDate}
              blockedSlots={[selectedTime]}
              onSelectSlot={(time) => {
                setSelectedTime(time);
                setShowAlternatives(false);
              }}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any specific questions or requirements..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Request Viewing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
