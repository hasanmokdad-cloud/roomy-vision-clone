import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfileForm } from '@/components/StudentProfileForm';
import { UnderwaterScene } from '@/components/UnderwaterScene';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
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
    <div className="min-h-screen relative">
      <UnderwaterScene />
      <Navbar />
      
      <div className="container mx-auto px-6 py-32">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-white/10 hover:neon-glow"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <StudentProfileForm 
          userId={userId} 
          onComplete={() => navigate('/ai-match')}
        />
      </div>

      <Footer />
    </div>
  );
}
