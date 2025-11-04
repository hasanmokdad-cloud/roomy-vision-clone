import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DormFull } from '@/types/dorm';

export function useAdminDormsQuery() {
  return useQuery({
    queryKey: ['admin-dorms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dorms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
