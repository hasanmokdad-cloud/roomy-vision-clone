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
  // Calculate progress phases (3 main phases like Airbnb)
  const phase = currentStep <= 4 ? 1 : currentStep <= 9 ? 2 : 3;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      {/* Progress bar */}
      <div className="flex gap-1 px-4 pt-2">
        {[1, 2, 3].map((p) => (
          <div
            key={p}
            className={`h-1 flex-1 rounded-full transition-colors ${
              p < phase ? 'bg-foreground' : p === phase ? 'bg-foreground' : 'bg-muted'
            }`}
            style={{
              background: p <= phase 
                ? 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)))' 
                : undefined
            }}
          />
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
