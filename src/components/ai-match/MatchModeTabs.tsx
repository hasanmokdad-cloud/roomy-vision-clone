import { motion } from 'framer-motion';
import { Home, Users, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface MatchModeTabsProps {
  activeMode: 'dorms' | 'roommates' | 'rooms';
  onModeChange: (mode: 'dorms' | 'roommates' | 'rooms') => void;
  counts?: {
    dorms?: number;
    roommates?: number;
    rooms?: number;
  };
  className?: string;
}

export const MatchModeTabs = ({ 
  activeMode, 
  onModeChange, 
  counts = {},
  className 
}: MatchModeTabsProps) => {
  const tabs = [
    { id: 'dorms' as const, label: 'Dorms', icon: Home, count: counts.dorms },
    { id: 'roommates' as const, label: 'Roommates', icon: Users, count: counts.roommates },
    { id: 'rooms' as const, label: 'Rooms', icon: Building2, count: counts.rooms }
  ];

  const activeIndex = tabs.findIndex(tab => tab.id === activeMode);

  // Swipe gesture for mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      const nextIndex = Math.min(activeIndex + 1, tabs.length - 1);
      onModeChange(tabs[nextIndex].id);
    },
    onSwipeRight: () => {
      const prevIndex = Math.max(activeIndex - 1, 0);
      onModeChange(tabs[prevIndex].id);
    }
  });

  return (
    <div className={className} {...swipeHandlers}>
      <div className="flex items-center justify-center bg-muted/50 rounded-lg p-1 relative">
        {/* Active tab indicator */}
        <motion.div
          className="absolute h-[calc(100%-8px)] bg-background rounded-md shadow-sm"
          animate={{
            x: activeIndex * (100 / tabs.length) + '%',
            width: `calc(${100 / tabs.length}% - 8px)`
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ left: '4px' }}
        />

        {/* Tabs */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className={`
                relative z-10 flex items-center justify-center gap-2 px-6 py-2.5
                flex-1 transition-colors duration-200 rounded-md
                ${isActive 
                  ? 'text-primary font-semibold' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <Badge variant={isActive ? 'default' : 'secondary'} className="ml-1 h-5 px-1.5">
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}

        {/* Blue underline */}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-primary"
          animate={{
            x: activeIndex * (100 / tabs.length) + '%',
            width: `${100 / tabs.length}%`
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
};
