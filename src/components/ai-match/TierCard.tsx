import { Check, ArrowUpRight, ArrowDownRight, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AiMatchPlan } from '@/utils/tierLogic';

interface TierCardProps {
  tier: AiMatchPlan;
  currentTier: AiMatchPlan;
  onUpgrade: (tier: AiMatchPlan) => void;
  onDowngrade: (tier: AiMatchPlan) => void;
  isLoading?: boolean;
}

const tierConfig = {
  basic: {
    name: 'Basic',
    price: 'Free',
    priceValue: 0,
    badge: { className: 'bg-muted text-muted-foreground border-muted', icon: null },
    card: { className: 'border-muted hover:border-muted-foreground/30' },
    features: [
      'Random roommate suggestions',
      '1 match only',
      'No personality matching'
    ]
  },
  advanced: {
    name: 'Advanced',
    price: '$4.99',
    priceValue: 4.99,
    badge: { className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: Sparkles },
    card: { className: 'border-blue-500/50 hover:border-blue-500' },
    features: [
      'Up to 3 roommate matches',
      'Personality compatibility scores',
      'Lifestyle & habits matching'
    ]
  },
  vip: {
    name: 'VIP',
    price: '$9.99',
    priceValue: 9.99,
    badge: { className: 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-400/50', icon: Crown },
    card: { className: 'border-amber-400 border-2 bg-gradient-to-br from-amber-500/5 to-orange-500/5' },
    features: [
      'Unlimited roommate matches',
      'Full personality matching',
      'Complete compatibility breakdown',
      'VIP priority & support'
    ]
  }
};

const tierOrder: AiMatchPlan[] = ['basic', 'advanced', 'vip'];

export const TierCard = ({ 
  tier, 
  currentTier, 
  onUpgrade, 
  onDowngrade,
  isLoading 
}: TierCardProps) => {
  const config = tierConfig[tier];
  const BadgeIcon = config.badge.icon;
  
  const currentIndex = tierOrder.indexOf(currentTier);
  const tierIndex = tierOrder.indexOf(tier);
  
  const isCurrentPlan = tier === currentTier;
  const isUpgrade = tierIndex > currentIndex;
  const isDowngrade = tierIndex < currentIndex;

  const handleClick = () => {
    if (isCurrentPlan) return;
    if (isUpgrade) {
      onUpgrade(tier);
    } else {
      onDowngrade(tier);
    }
  };

  const getButtonContent = () => {
    if (isCurrentPlan) {
      return (
        <>
          <Check className="w-4 h-4" />
          Current Plan
        </>
      );
    }
    if (isUpgrade) {
      return (
        <>
          Upgrade
          <ArrowUpRight className="w-4 h-4" />
        </>
      );
    }
    return (
      <>
        Downgrade
        <ArrowDownRight className="w-4 h-4" />
      </>
    );
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'outline';
    if (isUpgrade) return 'default';
    return 'ghost';
  };

  const getButtonClassName = () => {
    if (isCurrentPlan) return 'cursor-default opacity-70';
    if (isUpgrade && tier === 'vip') {
      return 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0';
    }
    if (isUpgrade && tier === 'advanced') {
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
    if (isDowngrade) {
      return 'text-muted-foreground hover:text-foreground';
    }
    return '';
  };

  return (
    <div 
      className={cn(
        'relative rounded-xl border p-4 md:p-6 transition-all duration-200',
        config.card.className,
        isCurrentPlan && 'ring-2 ring-primary/20'
      )}
    >
      {/* Header Row: Badge + Price + Button */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex flex-col gap-2">
          {/* Tier Badge */}
          <Badge 
            variant="outline" 
            className={cn('w-fit flex items-center gap-1.5 px-2.5 py-1', config.badge.className)}
          >
            {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
            {config.name}
          </Badge>
          
          {/* Price */}
          <span className="text-2xl font-bold">{config.price}</span>
        </div>

        {/* Action Button */}
        <Button
          variant={getButtonVariant()}
          size="sm"
          onClick={handleClick}
          disabled={isCurrentPlan || isLoading}
          className={cn('shrink-0 gap-1.5', getButtonClassName())}
        >
          {getButtonContent()}
        </Button>
      </div>

      {/* Features List */}
      <ul className="space-y-2">
        {config.features.map((feature, index) => (
          <li 
            key={index} 
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <Check className={cn(
              'w-4 h-4 shrink-0 mt-0.5',
              tier === 'vip' ? 'text-amber-500' : 
              tier === 'advanced' ? 'text-blue-500' : 
              'text-muted-foreground'
            )} />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};
