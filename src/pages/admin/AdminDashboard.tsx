import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import FluidBackground from '@/components/FluidBackground';
import AdminHome from './AdminHome';
import AdminDorms from './AdminDorms';
import AdminStudents from './AdminStudents';
import AdminNotifications from './AdminNotifications';
import AdminAnalytics from './AdminAnalytics';
import AdminLogs from './AdminLogs';
import AdminSettings from './AdminSettings';

export default function AdminDashboard() {
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

      if (!roles || !roles.some(r => r.role === 'admin')) {
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
          <AdminSidebar />
          
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            
            <main className="flex-1 p-6">
              <Routes>
                <Route path="/" element={<AdminHome />} />
                <Route path="/dorms" element={<AdminDorms />} />
                <Route path="/students" element={<AdminStudents />} />
                <Route path="/notifications" element={<AdminNotifications />} />
                <Route path="/analytics" element={<AdminAnalytics />} />
                <Route path="/logs" element={<AdminLogs />} />
                <Route path="/settings" element={<AdminSettings />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
