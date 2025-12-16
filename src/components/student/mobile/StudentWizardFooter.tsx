import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface StudentWizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting?: boolean;
}

const StudentWizardFooter = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isFirstStep,
  isLastStep,
  canProceed,
  isSubmitting = false
}: StudentWizardFooterProps) => {
  // Calculate phase (3 phases total)
  const getPhase = () => {
    if (currentStep <= 4) return 1; // About You
    if (currentStep <= 7) return 2; // Lifestyle
    return 3; // Preferences
  };
  
  const phase = getPhase();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      {/* Progress bar */}
      <div className="flex gap-1 px-4 pt-3">
        {[1, 2, 3].map((p) => (
          <div
            key={p}
            className={`h-1 flex-1 rounded-full transition-colors ${
              p <= phase ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
      
      {/* Phase label */}
      <div className="px-4 pt-1 pb-2">
        <span className="text-xs text-muted-foreground">
          {phase === 1 && 'About You'}
          {phase === 2 && 'Lifestyle'}
          {phase === 3 && 'Preferences'}
        </span>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex items-center justify-between px-4 pb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isFirstStep}
          className={`text-foreground underline ${isFirstStep ? 'invisible' : ''}`}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        
        <Button
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
        >
          {isSubmitting ? 'Saving...' : isLastStep ? 'Complete setup' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default StudentWizardFooter;
