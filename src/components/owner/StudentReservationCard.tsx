import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserX, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StudentReservationCardProps {
  student: {
    id: string;
    full_name: string;
    email: string;
    gender?: string;
    university?: string;
    major?: string;
    profile_photo_url?: string;
  };
  reservation: {
    id: string;
    status: string;
    paid_at: string | null;
  };
  roomId: string;
  onRemove: () => void;
}

export function StudentReservationCard({ 
  student, 
  reservation, 
  roomId, 
  onRemove 
}: StudentReservationCardProps) {
  const { toast } = useToast();

  const handleRemoveReservation = async () => {
    try {
      // Decrement room occupancy
      await supabase.rpc('decrement_room_occupancy', { room_id: roomId });

      // Clear student's current dorm/room
      await supabase
        .from('students')
        .update({
          current_dorm_id: null,
          current_room_id: null,
          accommodation_status: 'need_dorm'
        })
        .eq('id', student.id);

      // Update reservation status to cancelled
      await supabase
        .from('reservations')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', reservation.id);

      toast({
        title: 'Reservation Removed',
        description: `${student.full_name}'s reservation has been cancelled.`,
      });

      onRemove();
    } catch (error) {
      console.error('Error removing reservation:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove reservation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={student.profile_photo_url} alt={student.full_name} />
            <AvatarFallback>
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{student.full_name}</h4>
              <Badge variant={reservation.status === 'paid' ? 'default' : 'secondary'}>
                {reservation.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Mail className="w-3 h-3" />
              <span>{student.email}</span>
            </div>
            
            {student.university && (
              <p className="text-xs text-muted-foreground mt-1">
                {student.university} {student.major && `• ${student.major}`}
              </p>
            )}
            
            {student.gender && (
              <Badge variant="outline" className="text-xs mt-2">
                {student.gender === 'Male' && '♂ Male'}
                {student.gender === 'Female' && '♀ Female'}
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleRemoveReservation}
          className="ml-4"
        >
          <UserX className="w-4 h-4 mr-2" />
          Remove
        </Button>
      </div>
    </Card>
  );
}