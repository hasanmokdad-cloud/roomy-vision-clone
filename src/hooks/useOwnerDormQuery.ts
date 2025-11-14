import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DormFull } from '@/types/dorm';

export function useOwnerDormQuery(dormId?: string, ownerId?: string) {
  return useQuery({
    queryKey: ['owner-dorm', dormId],
    queryFn: async () => {
      if (!dormId || !ownerId) return null;
      
      const { data, error } = await supabase
        .from('dorms')
        .select('*')
        .eq('id', dormId)
        .eq('owner_id', ownerId)
        .single();
      
      if (error) throw error;
      return data as DormFull;
    },
    enabled: !!dormId && !!ownerId,
  });
}
