import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User, CheckCircle } from 'lucide-react';

interface Occupant {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  room_confirmed: boolean;
}

interface RoomOccupantPreviewProps {
  roomId: string;
  maxDisplay?: number;
  refreshTrigger?: number;
}

export function RoomOccupantPreview({ roomId, maxDisplay = 3, refreshTrigger }: RoomOccupantPreviewProps) {
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOccupants();
  }, [roomId, refreshTrigger]);

  const loadOccupants = async () => {
    try {
      // Get confirmed occupants from room_occupancy_claims
      const { data: claims, error } = await supabase
        .from('room_occupancy_claims')
        .select('student_id')
        .eq('room_id', roomId)
        .eq('status', 'confirmed');

      if (error) throw error;

      if (!claims || claims.length === 0) {
        setOccupants([]);
        return;
      }

      // Fetch student details
      const studentIds = claims.map(c => c.student_id);
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, profile_photo_url, room_confirmed')
        .in('id', studentIds);

      setOccupants(
        (students || []).map(s => ({
          id: s.id,
          full_name: s.full_name,
          profile_photo_url: s.profile_photo_url,
          room_confirmed: s.room_confirmed ?? false,
        }))
      );
    } catch (error) {
      console.error('Error loading occupants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || occupants.length === 0) {
    return null;
  }

  const displayOccupants = occupants.slice(0, maxDisplay);
  const remainingCount = occupants.length - maxDisplay;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Confirmed:</span>
        <div className="flex -space-x-2">
          {displayOccupants.map((occupant) => (
            <Tooltip key={occupant.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-7 w-7 border-2 border-background ring-1 ring-green-400 cursor-pointer hover:ring-2 transition-all">
                    <AvatarImage src={occupant.profile_photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      <User className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  {occupant.room_confirmed && (
                    <CheckCircle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-500 bg-background rounded-full" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{occupant.full_name}</p>
                <p className="text-xs text-muted-foreground">Confirmed Occupant</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center cursor-pointer">
                  <span className="text-xs font-medium text-muted-foreground">
                    +{remainingCount}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{remainingCount} more occupant{remainingCount > 1 ? 's' : ''}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
