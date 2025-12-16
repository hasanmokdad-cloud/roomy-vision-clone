import { X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentWizardTopBarProps {
  onSaveAndExit: () => void;
  onHelp?: () => void;
}

const StudentWizardTopBar = ({ onSaveAndExit, onHelp }: StudentWizardTopBarProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
      <Button
        variant="ghost"
        size="sm"
        onClick={onSaveAndExit}
        className="text-foreground hover:bg-muted"
      >
        <X className="w-5 h-5 mr-1" />
        Save & exit
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onHelp}
        className="text-foreground hover:bg-muted"
      >
        <HelpCircle className="w-5 h-5 mr-1" />
        Questions?
      </Button>
    </div>
  );
};

export default StudentWizardTopBar;
