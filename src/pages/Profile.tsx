import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StudentProfileForm } from '@/components/StudentProfileForm';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen relative bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 md:px-6 py-24 md:py-32 mt-16 md:mt-0"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/student')}
          className="mb-6 hover:bg-white/10 hover:neon-glow"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <StudentProfileForm 
          userId={userId} 
          onComplete={() => navigate('/ai-match')}
        />
      </motion.div>

      <Footer />
    </div>
  );
}
