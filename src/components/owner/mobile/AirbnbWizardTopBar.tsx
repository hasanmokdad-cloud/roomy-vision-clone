import { useNavigate } from 'react-router-dom';
import RoomyLogo from '@/assets/roomy-logo.png';

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
    <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between">
      {/* Roomy Logo */}
      <button onClick={handleLogoClick} className="focus:outline-none">
        <img 
          src={RoomyLogo} 
          alt="Roomy" 
          className="w-8 h-8 rounded-lg object-contain"
        />
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
