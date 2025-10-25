import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { FluidBackground } from '@/components/FluidBackground';
import OwnerHome from './OwnerHome';
import OwnerListings from './OwnerListings';
import OwnerAddDorm from './OwnerAddDorm';
import OwnerStats from './OwnerStats';
import OwnerAccount from './OwnerAccount';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (!roles || !roles.some(r => r.role === 'owner')) {
        navigate('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen relative">
      <FluidBackground />
      
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <OwnerSidebar />
          
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            
            <main className="flex-1 p-6">
              <Routes>
                <Route path="/" element={<OwnerHome />} />
                <Route path="/listings" element={<OwnerListings />} />
                <Route path="/add" element={<OwnerAddDorm />} />
                <Route path="/stats" element={<OwnerStats />} />
                <Route path="/account" element={<OwnerAccount />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
