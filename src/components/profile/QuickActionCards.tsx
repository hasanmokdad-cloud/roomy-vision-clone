import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, MessageSquare, Settings } from 'lucide-react';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';

interface QuickActionCardsProps {
  userId: string;
  personalityCompleted: boolean;
  savedCount?: number;
  onPersonalityClick: () => void;
}

export function QuickActionCards({
  userId,
  personalityCompleted,
  savedCount = 0,
  onPersonalityClick,
}: QuickActionCardsProps) {
  const navigate = useNavigate();
  const { count: unreadMessages } = useUnreadMessagesCount(userId);

  const cards = [
    {
      icon: Sparkles,
      label: 'Personality',
      subtitle: personalityCompleted ? 'Completed' : 'Take survey',
      badge: personalityCompleted ? '✓' : null,
      badgeColor: 'bg-green-500',
      onClick: onPersonalityClick,
      gradient: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-500',
    },
    {
      icon: Heart,
      label: 'Wishlists',
      subtitle: `${savedCount} saved`,
      badge: savedCount > 0 ? savedCount.toString() : null,
      badgeColor: 'bg-pink-500',
      onClick: () => navigate('/wishlists'),
      gradient: 'from-pink-500/10 to-red-500/10',
      iconColor: 'text-pink-500',
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      subtitle: unreadMessages > 0 ? `${unreadMessages} new` : 'Chat',
      badge: unreadMessages > 0 ? unreadMessages.toString() : null,
      badgeColor: 'bg-blue-500',
      onClick: () => navigate('/messages'),
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-500',
    },
    {
      icon: Settings,
      label: 'Account',
      subtitle: 'Security',
      badge: null,
      badgeColor: '',
      onClick: () => navigate('/settings'),
      gradient: 'from-gray-500/10 to-slate-500/10',
      iconColor: 'text-muted-foreground',
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={card.onClick}
          className={`flex-shrink-0 w-[85px] rounded-2xl p-3 bg-gradient-to-br ${card.gradient} border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95`}
        >
          <div className="relative">
            <card.icon className={`w-6 h-6 ${card.iconColor} mb-2`} />
            {card.badge && (
              <span className={`absolute -top-1 -right-1 ${card.badgeColor} text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1`}>
                {card.badge}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-foreground truncate">{card.label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{card.subtitle}</p>
        </button>
      ))}
    </div>
  );
}
