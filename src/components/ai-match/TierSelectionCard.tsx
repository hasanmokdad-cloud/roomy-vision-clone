import { Crown } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import type { AiMatchPlan } from "@/utils/tierLogic";

interface TierSelectionCardProps {
  selectedPlan: AiMatchPlan;
  onPlanChange: (plan: AiMatchPlan) => void;
}

export const TierSelectionCard = ({ selectedPlan, onPlanChange }: TierSelectionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6 space-y-4"
    >
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Crown className="w-6 h-6 text-amber-500" />
          Choose Your Match Plan
        </h2>
        <p className="text-muted-foreground">
          Select a plan to unlock the right roommate matches for you.
        </p>
      </div>

      <RadioGroup value={selectedPlan} onValueChange={(value) => onPlanChange(value as AiMatchPlan)}>
        <div className="grid gap-4">
          {/* Basic Plan */}
          <div className="flex items-start space-x-3 p-4 border border-muted rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <RadioGroupItem value="basic" id="tier-basic" className="mt-1" />
            <Label htmlFor="tier-basic" className="flex-1 cursor-pointer">
              <span className="font-bold text-base">Basic Match — Free</span>
              <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                <li>• Random roommate suggestions based on basic preferences</li>
                <li>• Personality matching is not included</li>
                <li>• 1 match only</li>
              </ul>
            </Label>
          </div>

          {/* Advanced Plan */}
          <div className="flex items-start space-x-3 p-4 border-2 border-blue-500 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer">
            <RadioGroupItem value="advanced" id="tier-advanced" className="mt-1" />
            <Label htmlFor="tier-advanced" className="flex-1 cursor-pointer">
              <span className="font-bold text-blue-600 dark:text-blue-400 text-base">
                Advanced Match — $4.99
              </span>
              <p className="text-xs text-muted-foreground italic mb-1">(Preview Mode – no payments yet)</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                <li>• Up to 3 matches with personality compatibility scores</li>
                <li>• Smarter roommate suggestions based on lifestyle & personality</li>
                <li>• Premium AI insights with compatibility breakdown</li>
              </ul>
            </Label>
          </div>

          {/* VIP Plan */}
          <div className="flex items-start space-x-3 p-4 border-2 border-amber-400 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 transition-colors cursor-pointer">
            <RadioGroupItem value="vip" id="tier-vip" className="mt-1" />
            <Label htmlFor="tier-vip" className="flex-1 cursor-pointer">
              <span className="font-bold text-amber-600 dark:text-amber-400 text-base flex items-center gap-1">
                <Crown className="w-4 h-4" />
                VIP Match — $9.99
              </span>
              <p className="text-xs text-muted-foreground italic mb-1">(Preview Mode – no payments yet)</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                <li>• Unlimited matches with full personality matching</li>
                <li>• Full compatibility breakdown (sleep, cleanliness, study habits)</li>
                <li>• Priority roommate suggestions</li>
                <li>• VIP-exclusive insights & support</li>
              </ul>
            </Label>
          </div>
        </div>
      </RadioGroup>
    </motion.div>
  );
};
