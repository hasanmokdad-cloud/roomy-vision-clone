import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OwnerBreadcrumb } from '@/components/owner/OwnerBreadcrumb';
import { DormForm } from '@/components/owner/DormForm';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <div className="max-w-4xl mx-auto">
          <OwnerBreadcrumb items={[
            { label: 'My Listings', href: '/owner/listings' },
            { label: 'Add New Dorm' }
          ]} />
          
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" onClick={() => navigate('/owner')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-foreground">Add New Dorm</h1>
            <p className="text-muted-foreground text-sm mt-1">Add your dorm information</p>
          </div>
          
          <DormForm 
            ownerId={ownerId} 
            onSaved={() => navigate('/owner/listings')}
            onCancel={() => navigate('/owner/listings')}
          />
        </div>
      </div>
    </OwnerLayout>
  );
}
