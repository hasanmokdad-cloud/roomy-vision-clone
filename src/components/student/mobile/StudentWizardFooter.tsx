import { Button } from '@/components/ui/button';

interface StudentWizardFooterProps {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  hasHousingPrefs?: boolean;
  hasPersonality?: boolean;
}

// Phase definitions for progress calculation (matching owner wizard style)
// Phase 1: Steps 2, 3, 4 (Basic Info, Hometown, Academic)
// Phase 2: Steps 6, 7 (Accommodation Status, Housing Preferences if needed)
// Phase 3: Steps 9, 10, 11 (Personality if enabled, Profile Extras, Review)

// Filler/transition steps:
// Step 1: Phase 1 overview (0%)
// Step 5: Phase 2 overview (33%)
// Step 8: Phase 3 overview (66%)

const StudentWizardFooter = ({
  currentStep,
  onBack,
  onNext,
  isNextDisabled = false,
  isLastStep = false,
  isSubmitting = false,
  hasHousingPrefs = true,
  hasPersonality = false,
}: StudentWizardFooterProps) => {
  // Filler steps and their positions
  const FILLER_STEPS: Record<number, number> = {
    1: 0,       // Phase 1 filler at 0%
    5: 1/3,     // Phase 2 filler at 33%
    8: 2/3,     // Phase 3 filler at 66%
  };
  
  // Phase 1 content steps: 2, 3, 4 (always present)
  const phase1Steps = [2, 3, 4];
  
  // Phase 2 content steps: 6 always, 7 only if hasHousingPrefs
  const phase2Steps = hasHousingPrefs ? [6, 7] : [6];
  
  // Phase 3 content steps: 9 only if hasPersonality, 10 always, 11 always
  const phase3Steps = hasPersonality ? [9, 10, 11] : [10, 11];
  
  let progressPercentage: number;
  
  if (currentStep in FILLER_STEPS) {
    progressPercentage = FILLER_STEPS[currentStep];
  } else if (phase1Steps.includes(currentStep)) {
    // Phase 1: 0% to 33%
    const idx = phase1Steps.indexOf(currentStep);
    const phaseProgress = (idx + 1) / phase1Steps.length;
    progressPercentage = phaseProgress * (1/3);
  } else if (phase2Steps.includes(currentStep)) {
    // Phase 2: 33% to 66%
    const idx = phase2Steps.indexOf(currentStep);
    const phaseProgress = (idx + 1) / phase2Steps.length;
    progressPercentage = (1/3) + phaseProgress * (1/3);
  } else if (phase3Steps.includes(currentStep)) {
    // Phase 3: 66% to 100%
    const idx = phase3Steps.indexOf(currentStep);
    const phaseProgress = (idx + 1) / phase3Steps.length;
    progressPercentage = (2/3) + phaseProgress * (1/3);
  } else {
    progressPercentage = 0;
  }

  // Distribute across 3 segments
  const phase1Fill = Math.min(1, progressPercentage * 3);
  const phase2Fill = Math.min(1, Math.max(0, (progressPercentage * 3) - 1));
  const phase3Fill = Math.min(1, Math.max(0, (progressPercentage * 3) - 2));
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white">
      {/* Progress bar - 3 segments */}
      <div className="flex gap-1 pt-3">
        {[phase1Fill, phase2Fill, phase3Fill].map((fill, index) => (
          <div
            key={index}
            className="h-[6px] flex-1 rounded-full bg-muted overflow-hidden"
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
          disabled={currentStep <= 1}
          className="text-[#222222] underline underline-offset-4 hover:bg-transparent disabled:opacity-30 font-semibold text-base"
        >
          Back
        </Button>
        
        <Button
          onClick={onNext}
          disabled={isNextDisabled || isSubmitting}
          className="bg-[#222222] text-white hover:bg-[#000000] rounded-lg px-6 py-3 font-semibold text-base h-12 min-w-[100px]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Submitting...
            </span>
          ) : isLastStep ? (
            'Complete setup'
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>
  );
};

export default StudentWizardFooter;
