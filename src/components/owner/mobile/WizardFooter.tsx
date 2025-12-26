import { Button } from '@/components/ui/button';

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
}

export function WizardFooter({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isNextDisabled = false,
  isLastStep = false,
  isSubmitting = false,
}: WizardFooterProps) {
  // Content steps (excluding transition pages 0, 1, 4, 13)
  const contentSteps = [2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 14];
  const totalContentSteps = contentSteps.length; // 11 steps

  // Find current position in content steps
  const currentContentIndex = contentSteps.findIndex(s => s === currentStep);
  const actualProgress = currentContentIndex === -1 
    ? contentSteps.filter(s => s < currentStep).length
    : currentContentIndex + 1;

  // Calculate progress as percentage
  const progressPercentage = actualProgress / totalContentSteps;

  // Distribute across 3 phases
  const phase1Fill = Math.min(1, progressPercentage * 3);
  const phase2Fill = Math.min(1, Math.max(0, (progressPercentage * 3) - 1));
  const phase3Fill = Math.min(1, Math.max(0, (progressPercentage * 3) - 2));
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      {/* Progress bar - 3 segments */}
      <div className="flex gap-1 px-4 pt-3">
        {[phase1Fill, phase2Fill, phase3Fill].map((fill, index) => (
          <div
            key={index}
            className="h-1 flex-1 rounded-full bg-muted overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-foreground transition-all duration-300"
              style={{ width: `${fill * 100}%` }}
            />
          </div>
        ))}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex items-center justify-between px-4 py-4">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={currentStep <= 1}
          className="text-foreground underline underline-offset-4 hover:bg-transparent disabled:opacity-30 font-medium"
        >
          Back
        </Button>
        
        <Button
          onClick={onNext}
          disabled={isNextDisabled || isSubmitting}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-6 py-3 font-semibold"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Submitting...
            </span>
          ) : isLastStep ? (
            'Submit for verification'
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>
  );
}