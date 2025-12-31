import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import Navbar from '@/components/shared/Navbar';
import { logAnalyticsEvent } from '@/utils/analytics';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { DormListings } from '@/components/DormListings';
import { Footer } from '@/components/Footer';
import { SkipToContent } from '@/components/SkipToContent';
import { Skeleton } from '@/components/ui/skeleton';

const Main = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect mobile users to listings page
    if (isMobile) {
      navigate('/listings', { replace: true });
      return;
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/listings', { replace: true });
        return;
      }

      // Log page view
      await logAnalyticsEvent({
        eventType: 'page_view',
        userId: session.user.id,
        metadata: { page: 'main' }
      });

      // Check if intro has been played this session
      const introPlayed = sessionStorage.getItem('intro-played');
      if (!introPlayed) {
        navigate('/intro', { replace: true });
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate, isMobile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-8 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <SkipToContent />
      {!isMobile && <Navbar />}
      <main id="main-content">
        <Hero />
        <HowItWorks />
        <DormListings />
      </main>
      <Footer />
    </div>
  );
};

export default Main;
