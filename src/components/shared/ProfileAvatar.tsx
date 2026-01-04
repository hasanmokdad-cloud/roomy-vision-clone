import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  profilePhotoUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-52 h-52 text-6xl',
};

export function ProfileAvatar({ 
  size = 'md', 
  profilePhotoUrl, 
  fullName, 
  email, 
  className 
}: ProfileAvatarProps) {
  // Get initial from fullName or email (before @)
  const getInitial = () => {
    if (fullName) return fullName.charAt(0).toUpperCase();
    if (email) return email.split('@')[0].charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={profilePhotoUrl || undefined} alt="Profile" />
      <AvatarFallback className="bg-[#222222] text-white font-medium">
        {getInitial()}
      </AvatarFallback>
    </Avatar>
  );
}
