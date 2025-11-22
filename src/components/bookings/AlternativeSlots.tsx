import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface AlternativeSlotsProps {
  date: Date;
  blockedSlots: string[];
  onSelectSlot: (time: string) => void;
}

const ALL_TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM'
];

export function AlternativeSlots({ date, blockedSlots, onSelectSlot }: AlternativeSlotsProps) {
  const availableSlots = ALL_TIME_SLOTS.filter(slot => !blockedSlots.includes(slot));

  if (availableSlots.length === 0) {
    return (
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-center text-muted-foreground">
          No alternative slots available for this date.
          Please select a different date.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Available time slots for {date.toLocaleDateString()}
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {availableSlots.map((slot) => (
            <Button
              key={slot}
              variant="outline"
              size="sm"
              onClick={() => onSelectSlot(slot)}
              className="text-xs"
            >
              {slot}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
