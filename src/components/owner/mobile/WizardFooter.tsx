import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  isVideoPreloading?: boolean;
  onClearAll?: () => void;
  showClearAll?: boolean;
}

// Phase definitions for progress calculation (25 total steps: 0-24)
// Step order: 0(intro), 1(filler1), 2-6(property info), 7(filler2), 8-12(location/amenities/photos),
// 13(filler3), 14(capacity), 15(upload method), 16(room names/excel), 17(room types),
// 18(bulk selection), 19(pricing), 20(tiered), 21(area), 22(capacity manual), 23(occupancy), 24(media), 25(review)

export function WizardFooter({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isNextDisabled = false,
  isLastStep = false,
  isSubmitting = false,
  isVideoPreloading = false,
  onClearAll,
  showClearAll = false,
}: WizardFooterProps) {
  // Phase 1 content steps: 2, 3, 4, 5, 6 (property type, title, gender, highlights, description)
  // Phase 2 content steps: 8, 9, 10, 11, 12 (location, amenities x3, photos)
  // Phase 3 content steps: 14-25 (capacity through review)
  
  // Filler steps and their positions:
  // Step 1: 0% (start of phase 1)
  // Step 7: 33.3% (end of phase 1, start of phase 2)
  // Step 13: 66.6% (end of phase 2, start of phase 3)
  
  const FILLER_STEPS: Record<number, number> = {
    1: 0,       // Phase 1 filler at 0%
    7: 1/3,     // Phase 2 filler at 33%
    14: 2/3,    // Phase 3 filler at 66% (updated from 13)
  };
  
  const phase1Steps = [2, 3, 4, 5, 6];
  const phase2Steps = [8, 9, 10, 11, 12, 13]; // Added 9 (NearbyUniversities), Photos now at 13
  const phase3Steps = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]; // Starts at 15 now
  
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
          disabled={currentStep <= 0}
          className="text-[#222222] underline underline-offset-4 hover:bg-transparent disabled:opacity-30 font-semibold text-base"
        >
          Back
        </Button>
        
        <div className="flex items-center gap-3">
          {showClearAll && onClearAll && (
            <Button
              variant="ghost"
              onClick={onClearAll}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear all
            </Button>
          )}
          
          <Button
            onClick={onNext}
            disabled={isNextDisabled || isSubmitting || isVideoPreloading}
            className="bg-[#222222] text-white hover:bg-[#000000] rounded-lg px-6 py-3 font-semibold text-base h-12 min-w-[100px]"
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
    </div>
  );
}