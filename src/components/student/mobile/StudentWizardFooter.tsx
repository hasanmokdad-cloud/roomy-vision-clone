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
  // Calculate progress percentage
  const progressPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      {/* Continuous progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
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
