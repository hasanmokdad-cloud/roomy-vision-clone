import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface GroupAvatarStackProps {
  groupPhoto?: string | null;
  groupName?: string;
  memberAvatars?: (string | null)[];
  size?: 'sm' | 'md' | 'lg';
}

export function GroupAvatarStack({
  groupPhoto,
  groupName,
  memberAvatars = [],
  size = 'md',
}: GroupAvatarStackProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-[49px] h-[49px]',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  // If there's a group photo, just show it
  if (groupPhoto) {
    return (
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={groupPhoto} alt={groupName} />
        <AvatarFallback className="bg-primary/20">
          <Users className={`${iconSizes[size]} text-primary`} />
        </AvatarFallback>
      </Avatar>
    );
  }

  // If we have member avatars, show a stack
  if (memberAvatars.length >= 2) {
    const stackSizes = {
      sm: { container: 'w-8 h-8', avatar: 'w-5 h-5', offset: '-ml-1' },
      md: { container: 'w-[49px] h-[49px]', avatar: 'w-7 h-7', offset: '-ml-2' },
      lg: { container: 'w-16 h-16', avatar: 'w-10 h-10', offset: '-ml-3' },
    };

    const stackConfig = stackSizes[size];
    const displayAvatars = memberAvatars.slice(0, 3);

    return (
      <div className={`${stackConfig.container} relative flex items-center justify-center`}>
        <div className="flex items-center">
          {displayAvatars.map((avatar, index) => (
            <Avatar
              key={index}
              className={`${stackConfig.avatar} border-2 border-background ${index > 0 ? stackConfig.offset : ''}`}
              style={{ zIndex: displayAvatars.length - index }}
            >
              <AvatarImage src={avatar || undefined} />
              <AvatarFallback className="bg-primary/20 text-xs">
                {groupName?.charAt(index) || '?'}
              </AvatarFallback>
            </Avatar>
          ))}
          {memberAvatars.length > 3 && (
            <div
              className={`${stackConfig.avatar} ${stackConfig.offset} rounded-full bg-muted flex items-center justify-center border-2 border-background text-xs font-medium`}
              style={{ zIndex: 0 }}
            >
              +{memberAvatars.length - 3}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback: show icon
  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarFallback className="bg-primary/20">
        <Users className={`${iconSizes[size]} text-primary`} />
      </AvatarFallback>
    </Avatar>
  );
}
