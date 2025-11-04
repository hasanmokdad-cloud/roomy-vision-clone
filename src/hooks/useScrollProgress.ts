import { useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function useScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const brightness = useTransform(scrollYProgress, [0, 1], [1, 0.85]);

  return { ref, scrollYProgress, opacity, scale, brightness };
}
