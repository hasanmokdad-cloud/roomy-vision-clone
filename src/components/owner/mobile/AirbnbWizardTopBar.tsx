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
    <div className="fixed top-0 left-0 right-0 z-50 px-8 lg:px-16 xl:px-24 py-4 flex items-center justify-between bg-white">
      {/* Roomy Logo */}
      <button onClick={handleLogoClick} className="focus:outline-none">
        <span className="text-lg font-semibold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
          Tenanters
        </span>
      </button>
      
      {/* Save & exit or Exit pill button */}
      <button
        onClick={onSaveExit}
        className="px-4 py-2 text-sm font-medium text-[#222222] border border-[#222222] rounded-full hover:bg-[#F7F7F7] transition-colors"
      >
        {isIntro ? 'Exit' : 'Save & exit'}
      </button>
    </div>
  );
}
