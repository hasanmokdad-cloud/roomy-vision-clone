import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfileForm } from '@/components/StudentProfileForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Profile() {
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  if (!userId) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background/95 to-background -z-10" />
      
      <div className="container mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/main')}
          className="mb-6 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Main
        </Button>

        <StudentProfileForm 
          userId={userId} 
          onComplete={() => navigate('/main')}
        />
      </div>
    </div>
  );
}
