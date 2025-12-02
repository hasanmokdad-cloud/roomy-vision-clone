import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Info } from 'lucide-react';

interface Category {
  label: string;
  score: number;
  description: string;
}

interface CategoryBreakdownBarsProps {
  categories: Category[];
  className?: string;
}

export const CategoryBreakdownBars = ({ categories, className }: CategoryBreakdownBarsProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {categories.map((category, index) => (
          <motion.div
            key={category.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <span className="font-medium">{category.label}</span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs font-semibold">{category.label} ({category.score}%)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-bold">{category.score}%</span>
            </div>
            <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${getScoreColor(category.score)}`}
                initial={{ width: 0 }}
                animate={{ width: `${category.score}%` }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
