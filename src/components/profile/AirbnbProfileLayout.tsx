import { ReactNode } from 'react';
import { User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProfileTab = 'about' | 'friends';

interface AirbnbProfileLayoutProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  children: ReactNode;
}

interface TabItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabItem({ icon, label, active, onClick }: TabItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
        active 
          ? "bg-[#F7F7F7] text-[#222222] font-medium" 
          : "text-[#717171] hover:bg-[#F7F7F7]/50"
      )}
    >
      <span className="w-6 h-6 flex items-center justify-center">
        {icon}
      </span>
      <span className="text-base">{label}</span>
    </button>
  );
}

export function AirbnbProfileLayout({ activeTab, onTabChange, children }: AirbnbProfileLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-white">
      {/* Left Sidebar */}
      <aside className="w-[280px] flex-shrink-0 border-r border-[#DDDDDD] py-8 px-6">
        <h1 className="text-[32px] font-bold text-[#222222] mb-8 font-sans">
          Profile
        </h1>
        
        <nav className="space-y-1">
          <TabItem
            icon={<User className="w-5 h-5" />}
            label="About me"
            active={activeTab === 'about'}
            onClick={() => onTabChange('about')}
          />
          <TabItem
            icon={<Users className="w-5 h-5" />}
            label="Friends"
            active={activeTab === 'friends'}
            onClick={() => onTabChange('friends')}
          />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-12 max-w-[720px]">
        {children}
      </main>
    </div>
  );
}
