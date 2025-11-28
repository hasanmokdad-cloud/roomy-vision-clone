import { Button } from '@/components/ui/button';
import { getMeetingPlatformIcon, getMeetingPlatformLabel, type MeetingPlatform } from '@/lib/meetingUtils';
import { ExternalLink } from 'lucide-react';

interface MeetingLinkButtonProps {
  meetingLink: string | null | undefined;
  platform?: MeetingPlatform;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function MeetingLinkButton({
  meetingLink,
  platform = 'google_meet',
  variant = 'default',
  size = 'default',
  className = ''
}: MeetingLinkButtonProps) {
  if (!meetingLink) return null;

  const Icon = getMeetingPlatformIcon(platform);
  const label = getMeetingPlatformLabel(platform);

  const handleClick = () => {
    // ALWAYS open in new tab, never use internal routing
    if (meetingLink.startsWith('http://') || meetingLink.startsWith('https://')) {
      window.open(meetingLink, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback: add https:// if missing
      window.open(`https://${meetingLink}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <ExternalLink className="w-3 h-3 opacity-70" />
    </Button>
  );
}
