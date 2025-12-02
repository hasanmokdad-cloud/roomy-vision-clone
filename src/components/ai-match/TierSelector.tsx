import { useState } from 'react';
import { Crown, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { isWhishConfigured } from '@/lib/payments/whishClient';
import { TierCard } from './TierCard';
import { DowngradeModal } from './DowngradeModal';
import type { AiMatchPlan } from '@/utils/tierLogic';

interface TierSelectorProps {
  currentTier: AiMatchPlan;
  onUpgrade: (tier: AiMatchPlan) => Promise<void>;
  onDowngrade: (tier: AiMatchPlan) => Promise<void>;
  isLoading?: boolean;
  studentId?: string;
}

export const TierSelector = ({ 
  currentTier, 
  onUpgrade, 
  onDowngrade,
  isLoading,
  studentId 
}: TierSelectorProps) => {
  const isPreviewMode = !isWhishConfigured();
  const [downgradeTarget, setDowngradeTarget] = useState<AiMatchPlan | null>(null);
  const [isDowngrading, setIsDowngrading] = useState(false);

  const handleDowngradeRequest = (tier: AiMatchPlan) => {
    setDowngradeTarget(tier);
  };

  const handleConfirmDowngrade = async () => {
    if (!downgradeTarget) return;
    
    setIsDowngrading(true);
    try {
      await onDowngrade(downgradeTarget);
    } finally {
      setIsDowngrading(false);
      setDowngradeTarget(null);
    }
  };

  const tiers: AiMatchPlan[] = ['basic', 'advanced', 'vip'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2 mb-2">
          <Crown className="w-6 h-6 text-amber-500" />
          Choose Your Match Plan
        </h2>
        <p className="text-muted-foreground">
          Select a plan to unlock the right roommate matches for you.
        </p>
      </div>

      {/* Preview Mode Alert */}
      {isPreviewMode && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Preview Mode:</strong> Payment processing will activate once Whish API keys are configured.
          </AlertDescription>
        </Alert>
      )}

      {/* Tier Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <TierCard
            key={tier}
            tier={tier}
            currentTier={currentTier}
            onUpgrade={onUpgrade}
            onDowngrade={handleDowngradeRequest}
            isLoading={isLoading}
            studentId={studentId}
          />
        ))}
      </div>

      {/* Downgrade Confirmation Modal */}
      <DowngradeModal
        isOpen={!!downgradeTarget}
        onClose={() => setDowngradeTarget(null)}
        onConfirm={handleConfirmDowngrade}
        currentTier={currentTier}
        targetTier={downgradeTarget || 'basic'}
        isLoading={isDowngrading}
      />
    </motion.div>
  );
};
