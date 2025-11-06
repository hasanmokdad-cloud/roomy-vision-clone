import { useLocation, Navigate } from 'react-router-dom';
import { AnimatedIntro } from '@/components/AnimatedIntro';

const Welcome = () => {
  const location = useLocation();
  const destination = (location.state as { destination?: string })?.destination || '/';

  // If accessed directly without state, redirect to homepage
  if (!location.state) {
    return <Navigate to="/" replace />;
  }

  return <AnimatedIntro destination={destination} />;
};

export default Welcome;
