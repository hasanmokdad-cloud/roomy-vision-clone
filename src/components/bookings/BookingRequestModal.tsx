import { useState } from 'react';
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
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              required
            />
          </div>

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
