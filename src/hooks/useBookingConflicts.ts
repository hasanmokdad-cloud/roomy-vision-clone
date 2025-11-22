import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ConflictCheckResult {
  isAvailable: boolean;
  conflictType: 'available' | 'booking_conflict' | 'owner_blocked' | 'error';
  details: any;
}

export const useBookingConflicts = (ownerId: string, dormId: string) => {
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<ConflictCheckResult | null>(null);

  const checkAvailability = async (date: Date, time: string): Promise<ConflictCheckResult> => {
    setChecking(true);

    try {
      const { data, error } = await supabase.rpc('check_booking_conflicts', {
        p_owner_id: ownerId,
        p_dorm_id: dormId,
        p_requested_date: format(date, 'yyyy-MM-dd'),
        p_requested_time: time,
      });

      if (error) throw error;

      const result = data && data.length > 0 ? data[0] : null;
      const checkResult: ConflictCheckResult = result
        ? {
            isAvailable: result.is_available,
            conflictType: result.conflict_type as 'available' | 'booking_conflict' | 'owner_blocked',
            details: result.conflict_details,
          }
        : {
            isAvailable: false,
            conflictType: 'error',
            details: {},
          };

      setLastCheck(checkResult);
      return checkResult;
    } catch (error: any) {
      console.error('Conflict check error:', error);
      const errorResult: ConflictCheckResult = {
        isAvailable: false,
        conflictType: 'error',
        details: { message: error.message },
      };
      setLastCheck(errorResult);
      return errorResult;
    } finally {
      setChecking(false);
    }
  };

  // Real-time subscription to availability changes
  useEffect(() => {
    const channel = supabase
      .channel(`availability-${dormId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'owner_availability',
          filter: `dorm_id=eq.${dormId}`,
        },
        () => {
          // Invalidate last check when availability changes
          setLastCheck(null);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tour_bookings',
          filter: `dorm_id=eq.${dormId}`,
        },
        () => {
          setLastCheck(null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dormId]);

  return {
    checking,
    lastCheck,
    checkAvailability,
  };
};
