import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FriendSuggestion {
  id: string;
  full_name: string;
  username: string | null;
  university: string | null;
  major: string | null;
  year_of_study: number | null;
  profile_photo_url: string | null;
  current_dorm_id: string | null;
  dorm?: {
    name: string;
  } | null;
  mutual_friends_count: number;
  match_reason: 'same_dorm' | 'same_university' | 'same_major';
}

export function useFriendSuggestions(studentId: string | null) {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    loadSuggestions();
  }, [studentId]);

  const loadSuggestions = async () => {
    if (!studentId) return;

    try {
      // Get current student data
      const { data: currentStudent, error: studentError } = await supabase
        .from('students')
        .select('university, major, current_dorm_id')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Get existing friendships (to exclude)
      const { data: existingFriendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('requester_id, receiver_id')
        .or(`requester_id.eq.${studentId},receiver_id.eq.${studentId}`);

      if (friendshipsError) throw friendshipsError;

      const excludedIds = new Set<string>([studentId]);
      existingFriendships?.forEach(f => {
        excludedIds.add(f.requester_id);
        excludedIds.add(f.receiver_id);
      });

      // Build query to find suggestions
      let query = supabase
        .from('students')
        .select(`
          id,
          full_name,
          username,
          university,
          major,
          year_of_study,
          profile_photo_url,
          current_dorm_id,
          dorm:dorms(name)
        `)
        .neq('id', studentId);

      // Filter by university, dorm, or major
      if (currentStudent.current_dorm_id || currentStudent.university || currentStudent.major) {
        query = query.or(
          `current_dorm_id.eq.${currentStudent.current_dorm_id},university.eq.${currentStudent.university},major.eq.${currentStudent.major}`
        );
      }

      const { data: potentialFriends, error: suggestionsError } = await query.limit(20);

      if (suggestionsError) throw suggestionsError;

      // Filter out existing friends and calculate mutual friends
      const filtered = (potentialFriends || []).filter(
        student => !excludedIds.has(student.id)
      );

      // For each suggestion, calculate mutual friends count
      const suggestionsWithMutuals = await Promise.all(
        filtered.map(async student => {
          const { data: mutualCount } = await supabase.rpc('get_mutual_friends_count', {
            user_a: studentId,
            user_b: student.id,
          });

          // Determine match reason
          let match_reason: FriendSuggestion['match_reason'] = 'same_university';
          if (student.current_dorm_id === currentStudent.current_dorm_id) {
            match_reason = 'same_dorm';
          } else if (student.major === currentStudent.major) {
            match_reason = 'same_major';
          }

          return {
            ...student,
            mutual_friends_count: mutualCount || 0,
            match_reason,
          };
        })
      );

      // Sort by: mutual friends count DESC, same dorm, same university
      const sorted = suggestionsWithMutuals.sort((a, b) => {
        // First by mutual friends
        if (b.mutual_friends_count !== a.mutual_friends_count) {
          return b.mutual_friends_count - a.mutual_friends_count;
        }
        // Then by match reason priority
        const priorityMap = { same_dorm: 3, same_major: 2, same_university: 1 };
        return priorityMap[b.match_reason] - priorityMap[a.match_reason];
      });

      setSuggestions(sorted.slice(0, 10)); // Limit to top 10
    } catch (error) {
      console.error('Error loading friend suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    suggestions,
    loading,
    refresh: loadSuggestions,
  };
}
