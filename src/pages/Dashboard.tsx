import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RoomyAI } from '@/components/RoomyAI';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Button } from '@/components/ui/button';
import { User, LogOut, Home } from 'lucide-react';
import { FluidBackground } from '@/components/FluidBackground';

export default function Dashboard() {
  const [userName, setUserName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        // Get user name from students table
        supabase
          .from('students')
          .select('full_name')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUserName(data.full_name);
            }
          });
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen relative">
      <FluidBackground />
      
      <div className="absolute top-6 right-6 z-50 flex gap-2">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="glass hover:bg-white/10 gap-2"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
        <Button
          onClick={() => navigate('/profile')}
          variant="ghost"
          className="glass hover:bg-white/10 gap-2"
        >
          <User className="w-4 h-4" />
          Profile
        </Button>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="glass hover:bg-white/10 gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <RoomyAI />
      <WhatsAppButton />
      
      <div className="text-center py-20 px-6 relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
          Welcome{userName && `, ${userName}`}! 👋
        </h1>
        <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
          Your AI-powered student housing dashboard. Use the Roomy AI button to find your perfect dorm!
        </p>
        
        <div className="mt-12 max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="glass-hover rounded-2xl p-6 text-left">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Chat with Roomy AI</h3>
            <p className="text-foreground/60 text-sm">
              Ask questions, get instant recommendations, and find dorms that match your preferences.
            </p>
          </div>
          
          <div className="glass-hover rounded-2xl p-6 text-left">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Matching</h3>
            <p className="text-foreground/60 text-sm">
              Our AI learns your preferences and suggests dorms that fit your budget, university, and lifestyle.
            </p>
          </div>
          
          <div className="glass-hover rounded-2xl p-6 text-left">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Verified Listings</h3>
            <p className="text-foreground/60 text-sm">
              All dorms are verified for quality and safety. Contact owners directly via WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
