import { useNavigate } from 'react-router-dom';

interface AirbnbWizardTopBarProps {
  onSaveExit: () => void;
  isIntro?: boolean;
}

export function AirbnbWizardTopBar({ onSaveExit, isIntro = false }: AirbnbWizardTopBarProps) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (isIntro) {
      navigate('/listings');
    } else {
      onSaveExit();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background px-6 py-4 flex items-center justify-between">
      {/* R Logo */}
      <button onClick={handleLogoClick} className="focus:outline-none">
        <span className="text-2xl font-bold text-primary">R</span>
      </button>
      
      {/* Save & exit or Exit pill button */}
      <button
        onClick={onSaveExit}
        className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-full hover:bg-muted transition-colors"
      >
        {isIntro ? 'Exit' : 'Save & exit'}
      </button>
    </div>
  );
}
