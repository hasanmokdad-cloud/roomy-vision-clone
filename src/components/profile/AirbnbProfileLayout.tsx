import { ReactNode } from 'react';
import { User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProfileTab = 'about' | 'friends';

interface AirbnbProfileLayoutProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  children: ReactNode;
  userInitial?: string;
  profilePhotoUrl?: string | null;
}

interface TabItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  showAvatar?: boolean;
  avatarInitial?: string;
  avatarUrl?: string | null;
}

function TabItem({ icon, label, active, onClick, showAvatar, avatarInitial, avatarUrl }: TabItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
        active 
          ? "bg-[#F7F7F7] text-[#222222] font-medium" 
          : "text-[#717171] hover:bg-[#F7F7F7]/50"
      )}
    >
      {showAvatar ? (
        <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-sm font-medium">{avatarInitial || 'U'}</span>
          )}
        </div>
      ) : (
        <span className="w-6 h-6 flex items-center justify-center">
          {icon}
        </span>
      )}
      <span className="text-[15px]">{label}</span>
    </button>
  );
}

export function AirbnbProfileLayout({ activeTab, onTabChange, children, userInitial, profilePhotoUrl }: AirbnbProfileLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-81px)] bg-white pt-20">
      {/* Left Sidebar */}
      <aside className="w-[400px] flex-shrink-0 py-10 pl-20 pr-8">
        <h1 className="text-[32px] font-semibold text-[#222222] mb-8 tracking-tight" style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}>
          Profile
        </h1>
        
        <nav className="space-y-1">
          <TabItem
            icon={<User className="w-5 h-5" />}
            label="About me"
            active={activeTab === 'about'}
            onClick={() => onTabChange('about')}
            showAvatar={true}
            avatarInitial={userInitial}
            avatarUrl={profilePhotoUrl}
          />
          <TabItem
            icon={<Users className="w-5 h-5" />}
            label="Friends"
            active={activeTab === 'friends'}
            onClick={() => onTabChange('friends')}
          />
        </nav>
      </aside>

      {/* Vertical Divider */}
      <div className="w-px bg-[#DDDDDD] flex-shrink-0" />

      {/* Main Content Area */}
      <main className="flex-1 py-10 px-12">
        {children}
      </main>
    </div>
  );
}
