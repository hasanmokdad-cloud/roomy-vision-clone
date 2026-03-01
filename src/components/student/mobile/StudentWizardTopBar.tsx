interface StudentWizardTopBarProps {
  onSaveAndExit: () => void;
}

const StudentWizardTopBar = ({ onSaveAndExit }: StudentWizardTopBarProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-8 lg:px-16 xl:px-24 py-4 flex items-center justify-between bg-white">
      {/* Tenanters Logo */}
      <button onClick={onSaveAndExit} className="focus:outline-none">
        <span className="text-lg font-semibold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
          Tenanters
        </span>
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
