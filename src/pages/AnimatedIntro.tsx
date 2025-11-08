import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { EntryAnimation } from '@/components/EntryAnimation';
import { FluidBackground } from '@/components/FluidBackground';

const AnimatedIntro = () => {
  const navigate = useNavigate();

  const handleComplete = useCallback(() => {
    sessionStorage.setItem('intro-played', 'true');
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <FluidBackground />
      <EntryAnimation onComplete={handleComplete} />
    </div>
  );
};

export default AnimatedIntro;
