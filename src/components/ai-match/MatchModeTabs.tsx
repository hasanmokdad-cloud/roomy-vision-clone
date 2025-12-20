import { motion } from 'framer-motion';
import { Users, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MatchModeTabsProps {
  activeMode: 'rooms' | 'roommates';
  onModeChange: (mode: 'rooms' | 'roommates') => void;
  counts?: {
    rooms?: number;
    roommates?: number;
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
    { id: 'rooms' as const, label: 'Rooms', icon: Building2, count: counts.rooms },
    { id: 'roommates' as const, label: 'Roommates', icon: Users, count: counts.roommates }
  ];

  const activeIndex = tabs.findIndex(tab => tab.id === activeMode);

  return (
    <div className={className}>
      <div className="relative flex items-center justify-center bg-muted/50 rounded-xl p-1.5">
        {/* Background pill indicator - using grid positioning */}
        <motion.div
          className="absolute inset-y-1.5 bg-background rounded-lg shadow-sm"
          initial={false}
          animate={{
            left: `calc(${activeIndex * 50}% + 6px)`,
            width: 'calc(50% - 8px)'
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />

        {/* Bottom purple underline */}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-primary rounded-full"
          initial={false}
          animate={{
            left: `calc(${activeIndex * 50}% + 8px)`,
            width: 'calc(50% - 16px)'
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />

        {/* Tabs Container - CSS Grid for perfect alignment */}
        <div className="relative z-10 grid grid-cols-2 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onModeChange(tab.id)}
                className={`
                  flex items-center justify-center gap-2 px-4 py-2.5
                  transition-colors duration-200 rounded-lg
                  ${isActive 
                    ? 'text-primary font-semibold' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm whitespace-nowrap">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge 
                    variant={isActive ? 'default' : 'secondary'} 
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
