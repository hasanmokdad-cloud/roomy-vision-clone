import { useState } from 'react';
import { Crown, Sparkles, Check, Lock, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PaymentModal } from '@/components/payments/PaymentModal';
import { MATCH_PLAN_PRICES } from '@/lib/payments/config';
import type { AiMatchPlan } from '@/utils/tierLogic';

interface MatchPlanSectionProps {
  currentPlan: AiMatchPlan;
  studentId?: string;
  onPlanChange: (plan: AiMatchPlan) => void;
}

const plans = [
  {
    id: 'basic' as AiMatchPlan,
    name: 'Free',
    price: '$0',
    priceValue: 0,
    features: ['1 random roommate', 'No personality matching', 'Basic filters'],
    icon: null,
    gradient: 'from-muted/50 to-muted/30',
    badgeClass: 'bg-muted text-muted-foreground',
  },
  {
    id: 'advanced' as AiMatchPlan,
    name: 'Advanced',
    price: '$4.99',
    priceValue: 4.99,
    features: ['Up to 3 matches', 'Personality scores', 'Lifestyle matching'],
    icon: Sparkles,
    gradient: 'from-blue-500/10 to-cyan-500/10',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  },
  {
    id: 'vip' as AiMatchPlan,
    name: 'VIP',
    price: '$9.99',
    priceValue: 9.99,
    features: ['Unlimited matches', 'Full personality', 'VIP support', 'Priority access'],
    icon: Crown,
    gradient: 'from-amber-500/10 to-orange-500/10',
    badgeClass: 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-600 border-amber-400/50',
  },
];

export function MatchPlanSection({ currentPlan, studentId, onPlanChange }: MatchPlanSectionProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AiMatchPlan | null>(null);

  const handleSelectPlan = (plan: AiMatchPlan) => {
    if (plan === currentPlan) return;

    const currentIndex = plans.findIndex((p) => p.id === currentPlan);
    const newIndex = plans.findIndex((p) => p.id === plan);

    if (newIndex > currentIndex && plan !== 'basic') {
      // Upgrade - show payment
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    } else {
      // Downgrade - direct update
      onPlanChange(plan);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    if (selectedPlan) {
      onPlanChange(selectedPlan);
    }
  };

  const getPlanConfig = () => {
    return plans.find((p) => p.id === selectedPlan) || plans[0];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-foreground">Match Plan</h3>
      </div>

      <div className="space-y-2">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrade = plans.findIndex((p) => p.id === plan.id) > plans.findIndex((p) => p.id === currentPlan);
          const PlanIcon = plan.icon;

          return (
            <div
              key={plan.id}
              className={cn(
                'rounded-xl border p-3 transition-all duration-200',
                isCurrent
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border/40 hover:border-border'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                      plan.gradient
                    )}
                  >
                    {PlanIcon ? (
                      <PlanIcon className="w-4 h-4 text-foreground" />
                    ) : (
                      <span className="text-xs font-bold">F</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{plan.name}</span>
                      {isCurrent && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{plan.price}</span>
                  </div>
                </div>

                {!isCurrent && (
                  <Button
                    size="sm"
                    variant={isUpgrade ? 'default' : 'ghost'}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={cn(
                      'h-7 text-xs gap-1',
                      isUpgrade && plan.id === 'vip'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                        : isUpgrade && plan.id === 'advanced'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : ''
                    )}
                  >
                    {isUpgrade ? (
                      <>
                        Upgrade <ArrowUpRight className="w-3 h-3" />
                      </>
                    ) : (
                      'Select'
                    )}
                  </Button>
                )}
              </div>

              {/* Features */}
              <div className="mt-2 flex flex-wrap gap-1">
                {plan.features.map((feature, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {selectedPlan && selectedPlan !== 'basic' && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          mode="ai_match_plan"
          amount={MATCH_PLAN_PRICES[selectedPlan]}
          description={`${getPlanConfig().name} Match Plan`}
          metadata={{
            planType: selectedPlan as 'advanced' | 'vip',
            studentId,
          }}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
