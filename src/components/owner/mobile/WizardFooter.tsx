import { ChevronLeft } from 'lucide-react';
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
      {/* Progress bar */}
      <div className="flex gap-1 px-4 pt-2">
        {[phase1Fill, phase2Fill, phase3Fill].map((fill, index) => (
          <div
            key={index}
            className="h-1 flex-1 rounded-full bg-muted overflow-hidden"
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${fill * 100}%`,
                background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)))'
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex items-center justify-between px-4 py-4">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={currentStep === 0}
          className="text-foreground underline font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        
        <Button
          onClick={onNext}
          disabled={isNextDisabled || isSubmitting}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-8 py-6 font-semibold"
        >
          {isSubmitting ? (
            'Submitting...'
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
