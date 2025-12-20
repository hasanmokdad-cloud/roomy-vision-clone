import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Clock, CheckCircle2, LogOut, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useRoomOccupancyClaim } from '@/hooks/useRoomOccupancyClaim';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AccommodationStatusCardProps {
  userId: string;
  onStatusChange?: () => void;
}

interface StudentData {
  accommodation_status: string | null;
  current_dorm_id: string | null;
  current_room_id: string | null;
  room_confirmed: boolean | null;
  need_roommate: boolean | null;
}

interface DormData {
  id: string;
  name: string;
  dorm_name: string | null;
}

interface RoomData {
  id: string;
  name: string;
  type: string | null;
  capacity: number | null;
  capacity_occupied: number | null;
}

export const AccommodationStatusCard = ({ userId, onStatusChange }: AccommodationStatusCardProps) => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [dorm, setDorm] = useState<DormData | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingRoommate, setUpdatingRoommate] = useState(false);
  
  const { existingClaim, checkOut, loading: claimLoading, refetch } = useRoomOccupancyClaim(userId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: studentData } = await supabase
          .from('students')
          .select('accommodation_status, current_dorm_id, current_room_id, room_confirmed, need_roommate')
          .eq('user_id', userId)
          .maybeSingle();

        if (studentData) {
          setStudent(studentData);

          if (studentData.current_dorm_id) {
            const { data: dormData } = await supabase
              .from('dorms')
              .select('id, name, dorm_name')
              .eq('id', studentData.current_dorm_id)
              .single();
            setDorm(dormData);
          }

          if (studentData.current_room_id) {
            const { data: roomData } = await supabase
              .from('rooms')
              .select('id, name, type, capacity, capacity_occupied')
              .eq('id', studentData.current_room_id)
              .single();
            setRoom(roomData);
          }
        }
      } catch (error) {
        console.error('Error fetching accommodation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleCheckOut = async () => {
    const success = await checkOut();
    if (success) {
      setStudent(prev => prev ? { ...prev, accommodation_status: 'need_dorm', current_dorm_id: null, current_room_id: null, room_confirmed: false } : null);
      setDorm(null);
      setRoom(null);
      onStatusChange?.();
    }
  };

  const handleRoommateToggle = async (checked: boolean) => {
    if (!student) return;
    
    setUpdatingRoommate(true);
    try {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (studentRecord) {
        await supabase
          .from('students')
          .update({ need_roommate: checked })
          .eq('id', studentRecord.id);

        setStudent(prev => prev ? { ...prev, need_roommate: checked } : null);
      }
    } catch (error) {
      console.error('Error updating roommate preference:', error);
    } finally {
      setUpdatingRoommate(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No accommodation status or need dorm
  if (!student || student.accommodation_status === 'need_dorm' || !student.current_dorm_id) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-muted rounded-full p-2">
            <Home className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Accommodation Status</h3>
            <p className="text-sm text-muted-foreground">Looking for a dorm</p>
          </div>
        </div>
      </div>
    );
  }

  // Has dorm - show status with confirmation badge
  const isConfirmed = student.room_confirmed === true;
  const isPending = existingClaim?.status === 'pending';
  const isRejected = existingClaim?.status === 'rejected';

  // Show roommate toggle if room not full
  const roomCapacity = room?.capacity || 1;
  const roomOccupied = room?.capacity_occupied || 0;
  const showRoommateToggle = roomCapacity > roomOccupied && roomCapacity > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      {/* Header with status badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${isConfirmed ? 'bg-green-100 dark:bg-green-900/30' : isPending ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted'}`}>
            {isConfirmed ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : isPending ? (
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Home className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Your Room</h3>
            {isConfirmed && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                Confirmed
              </Badge>
            )}
            {isPending && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                Pending Confirmation
              </Badge>
            )}
            {isRejected && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                Rejected
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Dorm and Room info */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Dorm</span>
          <span className="font-medium text-foreground">{dorm?.dorm_name || dorm?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Room</span>
          <span className="font-medium text-foreground">
            {room?.name} {room?.type ? `(${room.type})` : ''}
          </span>
        </div>
        {room && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Occupancy</span>
            <span className="font-medium text-foreground">
              {roomOccupied}/{roomCapacity}
            </span>
          </div>
        )}
      </div>

      {/* Pending message */}
      {isPending && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
          Your room claim is awaiting owner confirmation. You'll be notified once approved.
        </p>
      )}

      {/* Rejected message */}
      {isRejected && existingClaim?.rejection_reason && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          {existingClaim.rejection_reason}
        </p>
      )}

      {/* Looking for roommate toggle - only show if room not full */}
      {isConfirmed && showRoommateToggle && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <span className="font-medium text-foreground text-sm">Looking for a roommate?</span>
              <p className="text-xs text-muted-foreground">Find compatible roommates</p>
            </div>
          </div>
          <Switch
            checked={student.need_roommate || false}
            onCheckedChange={handleRoommateToggle}
            disabled={updatingRoommate}
          />
        </div>
      )}

      {/* Check Out button - only show if confirmed */}
      {isConfirmed && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled={claimLoading}
            >
              {claimLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Check Out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Check out from your room?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove your room assignment. You'll need to select a new room or submit a new claim if you want to update your accommodation status.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCheckOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Check Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </motion.div>
  );
};
