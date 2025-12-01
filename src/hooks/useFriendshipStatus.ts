import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FriendshipStatus = 
  | 'none' 
  | 'pending_sent' 
  | 'pending_received' 
  | 'friends' 
  | 'blocked_by_them'
  | 'blocked_by_you';

export function useFriendshipStatus(
  currentStudentId: string | null,
  otherStudentId: string | null
) {
  const [status, setStatus] = useState<FriendshipStatus>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStudentId || !otherStudentId || currentStudentId === otherStudentId) {
      setLoading(false);
      return;
    }

    checkFriendshipStatus();
  }, [currentStudentId, otherStudentId]);

  const checkFriendshipStatus = async () => {
    if (!currentStudentId || !otherStudentId) return;

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id, requester_id, receiver_id, status, blocker_id')
        .or(
          `and(requester_id.eq.${currentStudentId},receiver_id.eq.${otherStudentId}),and(requester_id.eq.${otherStudentId},receiver_id.eq.${currentStudentId})`
        )
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setStatus('none');
        setFriendshipId(null);
      } else {
        setFriendshipId(data.id);

        if (data.status === 'accepted') {
          setStatus('friends');
        } else if (data.status === 'blocked') {
          if (data.blocker_id === currentStudentId) {
            setStatus('blocked_by_you');
          } else {
            setStatus('blocked_by_them');
          }
        } else if (data.status === 'pending') {
          if (data.requester_id === currentStudentId) {
            setStatus('pending_sent');
          } else {
            setStatus('pending_received');
          }
        } else {
          setStatus('none');
        }
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
      setStatus('none');
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    friendshipId,
    loading,
    refresh: checkFriendshipStatus,
  };
}
