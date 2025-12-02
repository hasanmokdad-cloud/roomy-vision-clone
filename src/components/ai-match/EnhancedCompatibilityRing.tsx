import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EnhancedCompatibilityRingProps {
  percentage: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export const EnhancedCompatibilityRing = ({ 
  percentage, 
  size = 'medium',
  showLabel = true,
  className 
}: EnhancedCompatibilityRingProps) => {
  const sizeMap = {
    small: 60,
    medium: 80,
    large: 100
  };
  
  const dimension = sizeMap[size];
  const radius = (dimension - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return 'hsl(var(--chart-1))'; // Green
    if (percentage >= 50) return 'hsl(var(--chart-3))'; // Yellow
    return 'hsl(var(--chart-5))'; // Red
  };

  const getGlowColor = () => {
    if (percentage >= 80) return 'rgba(34, 197, 94, 0.3)';
    if (percentage >= 50) return 'rgba(234, 179, 8, 0.3)';
    return 'rgba(239, 68, 68, 0.3)';
  };

  const getLabel = () => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Low';
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: dimension, height: dimension }}>
      <svg width={dimension} height={dimension} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth="6"
          fill="none"
        />
        {/* Progress circle with glow */}
        <motion.circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ 
            filter: `drop-shadow(0 0 8px ${getGlowColor()})` 
          }}
        />
      </svg>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <span 
          className="font-black"
          style={{ 
            fontSize: size === 'small' ? '18px' : size === 'medium' ? '24px' : '32px',
            color: getColor() 
          }}
        >
          {percentage}%
        </span>
        {showLabel && (
          <span 
            className="text-xs font-medium text-muted-foreground"
            style={{ fontSize: size === 'small' ? '8px' : '10px' }}
          >
            {getLabel()}
          </span>
        )}
      </motion.div>
    </div>
  );
};
