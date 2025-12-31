import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function DashboardHeader() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Logged out',
      description: 'Successfully logged out',
    });
    sessionStorage.removeItem('intro-played');
    navigate('/listings');
  };

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 glass sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-xl font-bold gradient-text">Roomy Dashboard</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open('https://wa.me/96181858026', '_blank')}
          className="gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open('tel:+96181858026', '_blank')}
          className="gap-2"
        >
          <Phone className="w-4 h-4" />
          Call
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
