import { useNavigate } from 'react-router-dom';
import { FluidBackground } from '@/components/FluidBackground';
import { EntryAnimation } from '@/components/AnimatedIntro';

const AnimatedIntro = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <FluidBackground />
      <EntryAnimation onComplete={handleComplete} />
    </div>
  );
};

export default AnimatedIntro;
