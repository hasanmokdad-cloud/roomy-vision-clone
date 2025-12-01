import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MutualFriend {
  id: string;
  full_name: string;
  username: string | null;
  profile_photo_url: string | null;
  university: string | null;
  current_dorm_id: string | null;
  dorm?: {
    name: string;
  } | null;
}

export function useMutualFriends(
  studentIdA: string | null,
  studentIdB: string | null
) {
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentIdA || !studentIdB) {
      setLoading(false);
      return;
    }

    loadMutualFriends();
  }, [studentIdA, studentIdB]);

  const loadMutualFriends = async () => {
    if (!studentIdA || !studentIdB) return;

    try {
      // Get count from RPC function
      const { data: countData } = await supabase.rpc('get_mutual_friends_count', {
        user_a: studentIdA,
        user_b: studentIdB,
      });

      setCount(countData || 0);

      // Get list of mutual friends
      const { data: friendsA } = await supabase
        .from('friendships')
        .select('requester_id, receiver_id')
        .or(`requester_id.eq.${studentIdA},receiver_id.eq.${studentIdA}`)
        .eq('status', 'accepted');

      const { data: friendsB } = await supabase
        .from('friendships')
        .select('requester_id, receiver_id')
        .or(`requester_id.eq.${studentIdB},receiver_id.eq.${studentIdB}`)
        .eq('status', 'accepted');

      if (!friendsA || !friendsB) {
        setMutualFriends([]);
        return;
      }

      // Extract friend IDs
      const friendIdsA = new Set(
        friendsA.map(f =>
          f.requester_id === studentIdA ? f.receiver_id : f.requester_id
        )
      );

      const friendIdsB = new Set(
        friendsB.map(f =>
          f.requester_id === studentIdB ? f.receiver_id : f.requester_id
        )
      );

      // Find intersection
      const mutualIds = Array.from(friendIdsA).filter(id => friendIdsB.has(id));

      if (mutualIds.length === 0) {
        setMutualFriends([]);
        return;
      }

      // Fetch mutual friend details
      const { data: mutualFriendsData, error } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          username,
          profile_photo_url,
          university,
          current_dorm_id,
          dorm:dorms(name)
        `)
        .in('id', mutualIds);

      if (error) throw error;

      setMutualFriends(mutualFriendsData || []);
    } catch (error) {
      console.error('Error loading mutual friends:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    mutualFriends,
    count,
    loading,
    refresh: loadMutualFriends,
  };
}
