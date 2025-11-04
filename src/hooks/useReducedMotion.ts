import { useState, useEffect } from 'react';

export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);
  
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(query.matches);
    
    const onChange = () => setPrefersReduced(query.matches);
    query.addEventListener('change', onChange);
    
    return () => query.removeEventListener('change', onChange);
  }, []);
  
  return prefersReduced;
}
