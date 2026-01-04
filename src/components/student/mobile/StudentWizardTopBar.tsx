import { X } from 'lucide-react';
import RoomyLogo from '@/assets/roomy-logo.png';

interface StudentWizardTopBarProps {
  onSaveAndExit: () => void;
}

const StudentWizardTopBar = ({ onSaveAndExit }: StudentWizardTopBarProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white px-6 py-4 lg:px-12 flex items-center justify-between">
      <img 
        src={RoomyLogo} 
        alt="Roomy" 
        className="w-8 h-8 rounded-lg object-contain"
      />
      <button
        onClick={onSaveAndExit}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#222222] border border-[#222222] rounded-full hover:bg-[#F7F7F7] transition-colors"
      >
        <X className="w-4 h-4" />
        Save & exit
      </button>
    </div>
  );
};

export default StudentWizardTopBar;
