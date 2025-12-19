import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubPageHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function SubPageHeader({ title, onBack, rightElement }: SubPageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center px-4 safe-area-top">
      <button
        onClick={handleBack}
        className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-muted/50 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
      
      <h1 className="flex-1 text-center font-semibold text-foreground truncate pr-10">
        {title}
      </h1>
      
      {rightElement && (
        <div className="absolute right-4">
          {rightElement}
        </div>
      )}
    </header>
  );
}
