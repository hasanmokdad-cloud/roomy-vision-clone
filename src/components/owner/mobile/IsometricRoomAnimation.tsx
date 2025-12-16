import { motion } from 'framer-motion';

interface IsometricRoomAnimationProps {
  phase: 1 | 2 | 3;
}

export function IsometricRoomAnimation({ phase }: IsometricRoomAnimationProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -30, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    }
  };

  const floatAnimation = {
    y: [0, -5, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
  };

  return (
    <div className="relative w-full h-64 flex items-center justify-center overflow-hidden">
      <motion.div
        className="relative"
        style={{
          transform: 'perspective(800px) rotateX(20deg) rotateZ(-5deg)',
          transformStyle: 'preserve-3d',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Floor */}
        <motion.div
          variants={itemVariants}
          className="absolute w-48 h-48 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground)/0.1) 100%)',
            transform: 'translateZ(0px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }}
        />

        {/* Back wall */}
        <motion.div
          variants={itemVariants}
          className="absolute w-48 h-32 rounded-t-lg"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--primary)/0.1) 0%, hsl(var(--primary)/0.05) 100%)',
            transform: 'translateY(-128px) translateZ(0px)',
            borderBottom: '2px solid hsl(var(--border))',
          }}
        />

        {/* Side wall */}
        <motion.div
          variants={itemVariants}
          className="absolute w-24 h-32"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--secondary)/0.1) 0%, hsl(var(--secondary)/0.05) 100%)',
            transform: 'translateX(96px) translateY(-128px) skewY(-20deg)',
            borderLeft: '2px solid hsl(var(--border))',
          }}
        />

        {/* Phase 1: Basic furniture */}
        {phase >= 1 && (
          <>
            {/* Bed */}
            <motion.div
              variants={itemVariants}
              animate={floatAnimation}
              className="absolute w-20 h-10 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)',
                transform: 'translateX(10px) translateY(-20px) translateZ(10px)',
                boxShadow: '0 4px 12px hsl(var(--primary)/0.3)',
              }}
            />
            
            {/* Pillow */}
            <motion.div
              variants={itemVariants}
              className="absolute w-8 h-6 rounded-md"
              style={{
                background: 'hsl(var(--background))',
                transform: 'translateX(12px) translateY(-28px) translateZ(12px)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            />

            {/* Desk */}
            <motion.div
              variants={itemVariants}
              animate={floatAnimation}
              className="absolute w-16 h-3 rounded-sm"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--secondary)/0.8) 100%)',
                transform: 'translateX(100px) translateY(-50px) translateZ(8px)',
                boxShadow: '0 4px 12px hsl(var(--secondary)/0.3)',
              }}
            />

            {/* Desk legs */}
            <motion.div
              variants={itemVariants}
              className="absolute w-2 h-8"
              style={{
                background: 'hsl(var(--secondary)/0.6)',
                transform: 'translateX(100px) translateY(-42px) translateZ(8px)',
              }}
            />
            <motion.div
              variants={itemVariants}
              className="absolute w-2 h-8"
              style={{
                background: 'hsl(var(--secondary)/0.6)',
                transform: 'translateX(112px) translateY(-42px) translateZ(8px)',
              }}
            />
          </>
        )}

        {/* Phase 2: More furniture and decorations */}
        {phase >= 2 && (
          <>
            {/* Chair */}
            <motion.div
              variants={itemVariants}
              animate={floatAnimation}
              className="absolute w-8 h-8 rounded-md"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent)/0.8) 100%)',
                transform: 'translateX(90px) translateY(-30px) translateZ(15px)',
                boxShadow: '0 4px 10px hsl(var(--accent)/0.3)',
              }}
            />

            {/* Rug */}
            <motion.div
              variants={itemVariants}
              className="absolute w-24 h-16 rounded-full"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)/0.3) 0%, hsl(var(--secondary)/0.3) 100%)',
                transform: 'translateX(40px) translateY(10px) translateZ(2px)',
              }}
            />

            {/* Lamp */}
            <motion.div
              variants={itemVariants}
              animate={{ ...floatAnimation, scale: [1, 1.05, 1] }}
              className="absolute"
              style={{ transform: 'translateX(115px) translateY(-70px) translateZ(20px)' }}
            >
              <div className="w-4 h-8 bg-foreground/20 rounded-full" />
              <div 
                className="w-6 h-4 rounded-t-full -mt-1 ml-[-4px]"
                style={{ 
                  background: 'linear-gradient(180deg, hsl(var(--chart-4)) 0%, hsl(var(--chart-4)/0.6) 100%)',
                  boxShadow: '0 0 20px hsl(var(--chart-4)/0.5)',
                }}
              />
            </motion.div>

            {/* Plant */}
            <motion.div
              variants={itemVariants}
              animate={floatAnimation}
              className="absolute"
              style={{ transform: 'translateX(5px) translateY(-60px) translateZ(15px)' }}
            >
              <div className="w-5 h-6 rounded-md bg-amber-800" />
              <div className="w-8 h-10 rounded-full bg-green-500 -mt-8 ml-[-6px]" 
                style={{ boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
              />
            </motion.div>
          </>
        )}

        {/* Phase 3: Final touches */}
        {phase >= 3 && (
          <>
            {/* Wall art */}
            <motion.div
              variants={itemVariants}
              className="absolute w-12 h-10 rounded-sm"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--chart-1)) 0%, hsl(var(--chart-2)) 100%)',
                transform: 'translateX(60px) translateY(-110px) translateZ(5px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                border: '2px solid hsl(var(--background))',
              }}
            />

            {/* Shelf */}
            <motion.div
              variants={itemVariants}
              className="absolute w-14 h-2 rounded-sm"
              style={{
                background: 'hsl(var(--foreground)/0.3)',
                transform: 'translateX(10px) translateY(-90px) translateZ(10px)',
              }}
            />

            {/* Books on shelf */}
            <motion.div
              variants={itemVariants}
              className="absolute flex gap-1"
              style={{ transform: 'translateX(12px) translateY(-98px) translateZ(12px)' }}
            >
              <div className="w-2 h-6 bg-red-400 rounded-sm" />
              <div className="w-2 h-5 bg-blue-400 rounded-sm" />
              <div className="w-2 h-6 bg-green-400 rounded-sm" />
            </motion.div>

            {/* Window */}
            <motion.div
              variants={itemVariants}
              className="absolute w-16 h-20 rounded-md"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--chart-3)/0.3) 0%, hsl(var(--chart-3)/0.1) 100%)',
                transform: 'translateX(120px) translateY(-120px) translateZ(5px)',
                border: '3px solid hsl(var(--foreground)/0.2)',
              }}
            >
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-foreground/20" />
              <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-foreground/20" />
            </motion.div>

            {/* Curtain */}
            <motion.div
              variants={itemVariants}
              animate={{ x: [0, 2, 0], transition: { duration: 4, repeat: Infinity } }}
              className="absolute w-6 h-24 rounded-sm"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--primary)/0.4) 0%, hsl(var(--primary)/0.2) 100%)',
                transform: 'translateX(138px) translateY(-130px) translateZ(6px)',
              }}
            />
          </>
        )}
      </motion.div>
    </div>
  );
}
