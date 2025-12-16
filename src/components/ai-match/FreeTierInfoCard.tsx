import { Lock, Sparkles, Crown, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface FreeTierInfoCardProps {
  onUpgrade: () => void;
}

export function FreeTierInfoCard({ onUpgrade }: FreeTierInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-dashed border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-amber-600" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">You're on the Basic Plan</h3>
            <Badge variant="outline" className="text-[10px]">
              Free
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            You're seeing random compatible roommates. Upgrade for personality-based matching and better results.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Personality scores locked</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Limited to 1 match</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="mt-4 flex gap-2">
        <Button
          onClick={onUpgrade}
          size="sm"
          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white gap-1"
        >
          <Sparkles className="w-4 h-4" />
          Advanced $4.99
          <ArrowUpRight className="w-3 h-3" />
        </Button>
        <Button
          onClick={onUpgrade}
          size="sm"
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1"
        >
          <Crown className="w-4 h-4" />
          VIP $9.99
          <ArrowUpRight className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}
