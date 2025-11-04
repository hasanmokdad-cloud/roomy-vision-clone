import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DormFull } from '@/types/dorm';

export function useOwnerDormsQuery(ownerId?: string) {
  return useQuery({
    queryKey: ['owner-dorms', ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      
      const { data, error } = await supabase
        .from('dorms')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
  });
}
