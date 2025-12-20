import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReactionUser {
  id: string;
  emoji: string;
  userName: string;
  avatarUrl?: string;
  isCurrentUser: boolean;
  createdAt: string;
}

export function useReactionUsers(messageId: string, currentUserId: string) {
  const [reactionUsers, setReactionUsers] = useState<ReactionUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReactionUsers = async () => {
      setIsLoading(true);
      
      try {
        // Fetch reactions for this message
        const { data: reactions, error } = await supabase
          .from('message_reactions')
          .select('id, emoji, user_id, created_at')
          .eq('message_id', messageId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!reactions || reactions.length === 0) {
          setReactionUsers([]);
          setIsLoading(false);
          return;
        }

        // Get unique user IDs
        const userIds = [...new Set(reactions.map(r => r.user_id))];

        // Fetch student profiles
        const { data: students } = await supabase
          .from('students')
          .select('user_id, full_name, profile_photo_url')
          .in('user_id', userIds);

        // Fetch owner profiles
        const { data: owners } = await supabase
          .from('owners')
          .select('user_id, full_name, profile_photo_url')
          .in('user_id', userIds);

        // Build a user lookup map
        const userMap = new Map<string, { name: string; avatar?: string }>();
        
        students?.forEach(s => {
          userMap.set(s.user_id, { 
            name: s.full_name, 
            avatar: s.profile_photo_url || undefined 
          });
        });
        
        owners?.forEach(o => {
          userMap.set(o.user_id, { 
            name: o.full_name, 
            avatar: o.profile_photo_url || undefined 
          });
        });

        // Map reactions to user data
        const mappedUsers: ReactionUser[] = reactions.map(r => {
          const userInfo = userMap.get(r.user_id);
          return {
            id: r.id,
            emoji: r.emoji,
            userName: userInfo?.name || 'Unknown User',
            avatarUrl: userInfo?.avatar,
            isCurrentUser: r.user_id === currentUserId,
            createdAt: r.created_at,
          };
        });

        setReactionUsers(mappedUsers);
      } catch (error) {
        console.error('Error fetching reaction users:', error);
        setReactionUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (messageId) {
      fetchReactionUsers();
    }
  }, [messageId, currentUserId]);

  // Group reactions by emoji
  const groupedByEmoji = reactionUsers.reduce((acc, user) => {
    if (!acc[user.emoji]) {
      acc[user.emoji] = [];
    }
    acc[user.emoji].push(user);
    return acc;
  }, {} as Record<string, ReactionUser[]>);

  // Get unique emojis
  const emojis = Object.keys(groupedByEmoji);

  return { reactionUsers, groupedByEmoji, emojis, isLoading };
}
