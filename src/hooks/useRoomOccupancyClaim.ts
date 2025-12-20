import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { subscribeTo, unsubscribeFrom } from '@/lib/supabaseRealtime';

interface RoomOccupancyClaim {
  id: string;
  student_id: string;
  room_id: string;
  dorm_id: string;
  owner_id: string;
  status: 'pending' | 'confirmed' | 'rejected';
  claim_type: 'legacy' | 'reservation';
  confirmed_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface RoomWithOccupancy {
  id: string;
  name: string;
  type: string | null;
  capacity: number | null;
  capacity_occupied: number | null;
  roomy_confirmed_occupants: number | null;
  available: boolean | null;
}

export const useRoomOccupancyClaim = (userId: string | null) => {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [existingClaim, setExistingClaim] = useState<RoomOccupancyClaim | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch student data
  const fetchStudentData = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id, current_dorm_id, current_room_id, room_confirmed')
        .eq('user_id', userId)
        .maybeSingle();

      if (student) {
        setStudentId(student.id);

        // Check for existing claim
        if (student.current_room_id) {
          const { data: claim } = await supabase
            .from('room_occupancy_claims')
            .select('*')
            .eq('student_id', student.id)
            .eq('room_id', student.current_room_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          setExistingClaim(claim as RoomOccupancyClaim | null);
        } else {
          setExistingClaim(null);
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  // Real-time subscription for claim updates
  useEffect(() => {
    if (!studentId) return;

    const channel = subscribeTo(
      'room_occupancy_claims',
      (payload) => {
        const newClaim = payload.new as RoomOccupancyClaim;
        const oldClaim = payload.old as RoomOccupancyClaim;
        
        // Only process if this claim belongs to the current student
        if (newClaim?.student_id === studentId || oldClaim?.student_id === studentId) {
          console.log('Real-time claim update:', payload.eventType, payload);
          
          if (payload.eventType === 'UPDATE' && newClaim) {
            setExistingClaim(newClaim);
            
            // Show toast for status changes
            if (oldClaim?.status !== newClaim.status) {
              if (newClaim.status === 'confirmed') {
                toast({
                  title: "Room Confirmed! 🎉",
                  description: "The owner has confirmed your room occupancy",
                });
              } else if (newClaim.status === 'rejected') {
                toast({
                  title: "Claim Rejected",
                  description: newClaim.rejection_reason || "Your room claim was rejected by the owner",
                  variant: "destructive"
                });
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setExistingClaim(null);
          } else if (payload.eventType === 'INSERT' && newClaim) {
            setExistingClaim(newClaim);
          }
        }
      },
      { column: 'student_id', value: studentId }
    );

    return () => {
      unsubscribeFrom(channel);
    };
  }, [studentId, toast]);

  // Create a new room occupancy claim
  const createClaim = async (roomId: string, dormId: string): Promise<boolean> => {
    if (!studentId) {
      toast({
        title: "Error",
        description: "Student profile not found",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // Get the dorm owner
      const { data: dorm } = await supabase
        .from('dorms')
        .select('owner_id')
        .eq('id', dormId)
        .single();

      if (!dorm?.owner_id) {
        toast({
          title: "Error",
          description: "Dorm owner not found",
          variant: "destructive"
        });
        return false;
      }

      // Check if a claim already exists
      const { data: existingClaim } = await supabase
        .from('room_occupancy_claims')
        .select('id, status')
        .eq('student_id', studentId)
        .eq('room_id', roomId)
        .maybeSingle();

      if (existingClaim) {
        if (existingClaim.status === 'pending') {
          toast({
            title: "Already Pending",
            description: "Your room claim is already pending owner confirmation",
          });
          return true;
        } else if (existingClaim.status === 'confirmed') {
          toast({
            title: "Already Confirmed",
            description: "Your room occupancy is already confirmed",
          });
          return true;
        }
      }

      // Create new claim
      const { error: claimError } = await supabase
        .from('room_occupancy_claims')
        .insert({
          student_id: studentId,
          room_id: roomId,
          dorm_id: dormId,
          owner_id: dorm.owner_id,
          status: 'pending',
          claim_type: 'legacy'
        });

      if (claimError) throw claimError;

      // Update student's current dorm and room
      const { error: updateError } = await supabase
        .from('students')
        .update({
          current_dorm_id: dormId,
          current_room_id: roomId,
          accommodation_status: 'have_dorm',
          room_confirmed: false
        })
        .eq('id', studentId);

      if (updateError) throw updateError;

      toast({
        title: "Claim Submitted",
        description: "Your room claim is pending owner confirmation",
      });

      return true;
    } catch (error) {
      console.error('Error creating claim:', error);
      toast({
        title: "Error",
        description: "Failed to submit room claim",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if room can be claimed (not fully booked via Roomy)
  const canClaimRoom = (room: RoomWithOccupancy): { canClaim: boolean; reason?: string } => {
    const capacity = room.capacity || 1;
    const roomyConfirmed = room.roomy_confirmed_occupants || 0;

    // Block if all spots filled via Roomy reservations
    if (roomyConfirmed >= capacity) {
      return { 
        canClaim: false, 
        reason: 'Fully booked via Roomy' 
      };
    }

    return { canClaim: true };
  };

  // Check out from current room using edge function
  const checkOut = async (): Promise<boolean> => {
    if (!studentId) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('student-checkout', {});

      if (error) {
        console.error('Checkout error:', error);
        throw new Error(error.message || 'Failed to check out');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to check out');
      }

      setExistingClaim(null);
      
      toast({
        title: "Checked Out",
        description: "You have been checked out from your room",
      });

      return true;
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check out",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    studentId,
    existingClaim,
    loading,
    createClaim,
    canClaimRoom,
    checkOut,
    refetch: async () => {
      if (!studentId) return;
      const { data: claim } = await supabase
        .from('room_occupancy_claims')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setExistingClaim(claim as RoomOccupancyClaim | null);
    }
  };
};
