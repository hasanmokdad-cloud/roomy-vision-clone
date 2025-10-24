import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatButton } from './ChatButton';
import { ChatModal } from './ChatModal';
import { AuthRequiredModal } from './AuthRequiredModal';
import { DormFinder } from './DormFinder';

export const RoomyAI = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleChatClick = () => {
    if (!userId) {
      setIsAuthModalOpen(true);
    } else {
      setIsChatOpen(true);
    }
  };

  const handleFinderClick = () => {
    if (!userId) {
      setIsAuthModalOpen(true);
    } else {
      setIsFinderOpen(true);
    }
  };

  return (
    <>
      <ChatButton onClick={handleChatClick} />
      
      {userId && (
        <>
          <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userId={userId} />
          <DormFinder isOpen={isFinderOpen} onClose={() => setIsFinderOpen(false)} userId={userId} />
        </>
      )}
      
      <AuthRequiredModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export { DormFinder };