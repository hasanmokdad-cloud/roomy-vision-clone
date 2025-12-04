import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { DormForm } from '@/components/owner/DormForm';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Loader2 } from 'lucide-react';

export default function OwnerAddDorm() {
  const navigate = useNavigate();
  const { userId } = useRoleGuard('owner');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwnerId = async () => {
      if (!userId) return;
      
      const { data } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setOwnerId(data.id);
      }
      setLoading(false);
    };

    fetchOwnerId();
  }, [userId]);

  if (loading || !ownerId) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <DormForm 
          ownerId={ownerId} 
          onSaved={() => navigate('/owner/listings')}
          onCancel={() => navigate('/owner/listings')}
        />
      </div>
    </OwnerLayout>
  );
}
