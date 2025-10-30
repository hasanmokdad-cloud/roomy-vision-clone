import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const Confetti: React.FC = () => {
  const [pieces] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      rotation: Math.random() * 360,
      color: ['hsl(var(--primary))', 'hsl(var(--secondary))', '#FFD700', '#FF69B4'][
        Math.floor(Math.random() * 4)
      ],
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.2
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.size % 2 === 0 ? '50%' : '0%'
          }}
          initial={{
            y: -20,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: piece.rotation * 3,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: piece.delay,
            ease: 'easeIn'
          }}
        />
      ))}
    </div>
  );
};
