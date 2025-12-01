import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { subscribeTo, unsubscribeFrom } from '@/lib/supabaseRealtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked' | 'cancelled';
  acted_by: string | null;
  blocker_id: string | null;
  blocked_at: string | null;
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    full_name: string;
    username: string | null;
    university: string | null;
    major: string | null;
    year_of_study: number | null;
    profile_photo_url: string | null;
    current_dorm_id: string | null;
  };
  receiver?: {
    id: string;
    full_name: string;
    username: string | null;
    university: string | null;
    major: string | null;
    year_of_study: number | null;
    profile_photo_url: string | null;
    current_dorm_id: string | null;
  };
}

export function useFriendships(studentId: string | null) {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    loadFriendships();

    // Subscribe to real-time updates
    const channel = subscribeTo('friendships', handleRealtimeUpdate);

    return () => {
      unsubscribeFrom(channel);
    };
  }, [studentId]);

  const loadFriendships = async () => {
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:students!friendships_requester_id_fkey(
            id, full_name, username, university, major, year_of_study, profile_photo_url, current_dorm_id
          ),
          receiver:students!friendships_receiver_id_fkey(
            id, full_name, username, university, major, year_of_study, profile_photo_url, current_dorm_id
          )
        `)
        .or(`requester_id.eq.${studentId},receiver_id.eq.${studentId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFriendships(data || []);
    } catch (error: any) {
      console.error('Error loading friendships:', error);
      toast({
        title: 'Error',
        description: 'Failed to load friendships',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      loadFriendships(); // Reload to get full data with joins
    } else if (eventType === 'UPDATE') {
      setFriendships(prev =>
        prev.map(f => (f.id === newRecord.id ? { ...f, ...newRecord } : f))
      );
    } else if (eventType === 'DELETE') {
      setFriendships(prev => prev.filter(f => f.id !== oldRecord.id));
    }
  };

  const sendRequest = async (receiverId: string) => {
    if (!studentId) return;

    try {
      const { error } = await supabase.from('friendships').insert({
        requester_id: studentId,
        receiver_id: receiverId,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Friend request sent',
        description: 'Your friend request has been sent',
      });
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send friend request',
        variant: 'destructive',
      });
    }
  };

  const acceptRequest = async (friendshipId: string, conversationId?: string) => {
    if (!studentId) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .update({
          status: 'accepted',
          acted_by: studentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', friendshipId);

      if (error) throw error;

      // Send "You're now friends" message if conversation exists
      if (conversationId) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: studentId,
          body: "You're now friends on Roomy 🎉",
          type: 'system',
        });
      }

      toast({
        title: 'Friend request accepted',
        description: "You're now friends!",
      });
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive',
      });
    }
  };

  const rejectRequest = async (friendshipId: string) => {
    if (!studentId) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .update({
          status: 'rejected',
          acted_by: studentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: 'Friend request rejected',
      });
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject friend request',
        variant: 'destructive',
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: 'Friend removed',
      });
    } catch (error: any) {
      console.error('Error removing friend:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove friend',
        variant: 'destructive',
      });
    }
  };

  const blockUser = async (friendshipId: string, userToBlock: string) => {
    if (!studentId) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .update({
          status: 'blocked',
          blocker_id: studentId,
          blocked_at: new Date().toISOString(),
          acted_by: studentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: 'User blocked',
        description: 'You will no longer receive messages from this user',
      });
    } catch (error: any) {
      console.error('Error blocking user:', error);
      toast({
        title: 'Error',
        description: 'Failed to block user',
        variant: 'destructive',
      });
    }
  };

  // Filter friendships by type
  const friends = friendships.filter(f => f.status === 'accepted');
  const pendingRequests = friendships.filter(
    f => f.status === 'pending' && f.receiver_id === studentId
  );
  const sentRequests = friendships.filter(
    f => f.status === 'pending' && f.requester_id === studentId
  );

  return {
    friendships,
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    blockUser,
    refresh: loadFriendships,
  };
}
