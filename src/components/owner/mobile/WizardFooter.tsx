import { Button } from '@/components/ui/button';

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  isVideoPreloading?: boolean;
}

// Filler/transition steps and their progress bar positions (at segment intersections)
const FILLER_STEP_PROGRESS: Record<number, number> = {
  1: 0,      // Step 1 filler: 0% (start of segment 1)
  4: 0.333,  // Step 2 filler: 33% (intersection of segments 1 & 2)
  13: 0.666, // Step 3 filler: 66% (intersection of segments 2 & 3)
};

export function WizardFooter({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isNextDisabled = false,
  isLastStep = false,
  isSubmitting = false,
  isVideoPreloading = false,
}: WizardFooterProps) {
  // Content steps (excluding transition pages 0, 1, 4, 13)
  const contentSteps = [2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 14];
  const totalContentSteps = contentSteps.length; // 11 steps

  // Check if current step is a filler/transition step
  const isFillerStep = currentStep in FILLER_STEP_PROGRESS;

  let progressPercentage: number;
  
  if (isFillerStep) {
    // Use fixed positions for filler steps
    progressPercentage = FILLER_STEP_PROGRESS[currentStep];
  } else {
    // Find current position in content steps
    const currentContentIndex = contentSteps.findIndex(s => s === currentStep);
    const actualProgress = currentContentIndex === -1 
      ? contentSteps.filter(s => s < currentStep).length
      : currentContentIndex + 1;

    // Calculate progress as percentage
    progressPercentage = actualProgress / totalContentSteps;
  }

  // Distribute across 3 phases
  const phase1Fill = Math.min(1, progressPercentage * 3);
  const phase2Fill = Math.min(1, Math.max(0, (progressPercentage * 3) - 1));
  const phase3Fill = Math.min(1, Math.max(0, (progressPercentage * 3) - 2));
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white">
      {/* Progress bar - 3 segments, full width */}
      <div className="flex gap-1 pt-3">
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
      <div className="flex items-center justify-between px-8 lg:px-16 xl:px-24 py-6">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={currentStep <= 0}
          className="text-[#222222] underline underline-offset-4 hover:bg-transparent disabled:opacity-30 font-semibold text-base"
        >
          Back
        </Button>
        
        <Button
          onClick={onNext}
          disabled={isNextDisabled || isSubmitting || isVideoPreloading}
          className="bg-[#222222] text-white hover:bg-[#000000] rounded-lg px-8 py-4 font-semibold text-base min-w-[120px]"
        >
          {isVideoPreloading ? (
            <span className="flex items-center gap-1 text-lg tracking-widest">
              <span className="animate-bounce" style={{ animationDelay: '0ms', animationDuration: '600ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms', animationDuration: '600ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms', animationDuration: '600ms' }}>.</span>
            </span>
          ) : isSubmitting ? (
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