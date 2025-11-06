import { useLocation, Navigate } from 'react-router-dom';
import { AnimatedIntro } from '@/components/AnimatedIntro';

const Welcome = () => {
  const location = useLocation();
  const destination = (location.state as { destination?: string })?.destination || '/dashboard';

  // If accessed directly without state, redirect to dashboard
  if (!location.state) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AnimatedIntro destination={destination} />;
};

export default Welcome;
