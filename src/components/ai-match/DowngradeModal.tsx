import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowDown } from 'lucide-react';
import type { AiMatchPlan } from '@/utils/tierLogic';

interface DowngradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentTier: AiMatchPlan;
  targetTier: AiMatchPlan;
  isLoading?: boolean;
}

const tierNames: Record<AiMatchPlan, string> = {
  basic: 'Basic',
  advanced: 'Advanced',
  vip: 'VIP'
};

export const DowngradeModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentTier,
  targetTier,
  isLoading
}: DowngradeModalProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-muted-foreground" />
            Confirm Downgrade
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You're about to downgrade from <strong>{tierNames[currentTier]}</strong> to{' '}
              <strong>{tierNames[targetTier]}</strong>.
            </p>
            <p>
              This change will take effect at the end of your current billing cycle. 
              You'll keep your current benefits until then.
            </p>
            {targetTier === 'basic' && (
              <p className="text-amber-600 dark:text-amber-400">
                Note: Basic plan includes only 1 random match without personality matching.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isLoading}
            className="bg-muted text-foreground hover:bg-muted/80"
          >
            {isLoading ? 'Processing...' : 'Confirm Downgrade'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
