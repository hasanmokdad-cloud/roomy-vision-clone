import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhyThisMatchProps {
  reasons: string[];
  className?: string;
}

export const WhyThisMatch = ({ reasons, className }: WhyThisMatchProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!reasons || reasons.length === 0) return null;

  return (
    <div className={className}>
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between p-3 h-auto hover:bg-primary/5"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="w-4 h-4" />
          Why this match?
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary" />
        )}
      </Button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 p-3 bg-primary/5 rounded-b-lg">
              {reasons.slice(0, 6).map((reason, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>
                    {reason.split(' ').map((word, i) => {
                      // Highlight key words
                      if (word.match(/\$\d+|\d+%|compatible|match|near|budget|university/i)) {
                        return <span key={i} className="text-primary font-semibold">{word} </span>;
                      }
                      return word + ' ';
                    })}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
