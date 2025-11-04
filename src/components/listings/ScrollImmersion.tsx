import { motion, useScroll, useTransform } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollImmersionProps {
  children: ReactNode;
}

export function ScrollImmersion({ children }: ScrollImmersionProps) {
  const { scrollYProgress } = useScroll();
  
  // Transform brightness and saturation as user scrolls
  const brightness = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const saturation = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <motion.div
      style={{
        filter: useTransform(
          [brightness, saturation],
          ([b, s]) => `brightness(${b}) saturate(${s})`
        )
      }}
      className="relative"
    >
      {/* Parallax background layer */}
      <motion.div
        style={{
          y: useTransform(scrollYProgress, [0, 1], [0, -200]),
          opacity: useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.2, 0.1])
        }}
        className="fixed inset-0 -z-10 pointer-events-none"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-accent/5 to-background" />
      </motion.div>
      
      {children}
    </motion.div>
  );
}
