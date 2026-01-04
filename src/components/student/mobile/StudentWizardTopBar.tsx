import RoomyLogo from '@/assets/roomy-logo.png';

interface StudentWizardTopBarProps {
  onSaveAndExit: () => void;
}

const StudentWizardTopBar = ({ onSaveAndExit }: StudentWizardTopBarProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-8 lg:px-16 xl:px-24 py-4 flex items-center justify-between bg-white">
      {/* Roomy Logo */}
      <button onClick={onSaveAndExit} className="focus:outline-none">
        <img 
          src={RoomyLogo} 
          alt="Roomy" 
          className="w-8 h-8 rounded-lg object-contain"
        />
      </button>
      
      {/* Save & exit pill button */}
      <button
        onClick={onSaveAndExit}
        className="px-4 py-2 text-sm font-medium text-[#222222] border border-[#222222] rounded-full hover:bg-[#F7F7F7] transition-colors"
      >
        Save & exit
      </button>
    </div>
  );
};

export default StudentWizardTopBar;
