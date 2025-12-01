import { Button } from '@/components/ui/button';
import { UserPlus, Check, Clock } from 'lucide-react';
import { useFriendshipStatus } from '@/hooks/useFriendshipStatus';
import { useFriendships } from '@/hooks/useFriendships';

interface AddFriendButtonProps {
  currentStudentId: string;
  targetStudentId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function AddFriendButton({
  currentStudentId,
  targetStudentId,
  variant = 'default',
  size = 'default',
  className,
}: AddFriendButtonProps) {
  const { status, friendshipId, loading } = useFriendshipStatus(
    currentStudentId,
    targetStudentId
  );
  const { sendRequest, acceptRequest } = useFriendships(currentStudentId);

  const handleClick = async () => {
    if (status === 'none') {
      await sendRequest(targetStudentId);
    } else if (status === 'pending_received' && friendshipId) {
      await acceptRequest(friendshipId);
    }
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Clock className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (status === 'friends') {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <Check className="h-4 w-4 mr-2" />
        Friends
      </Button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <Clock className="h-4 w-4 mr-2" />
        Request Sent
      </Button>
    );
  }

  if (status === 'pending_received') {
    return (
      <Button variant="default" size={size} onClick={handleClick} className={className}>
        <Check className="h-4 w-4 mr-2" />
        Accept Request
      </Button>
    );
  }

  if (status === 'blocked_by_you' || status === 'blocked_by_them') {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        Blocked
      </Button>
    );
  }

  // Default: none
  return (
    <Button variant={variant} size={size} onClick={handleClick} className={className}>
      <UserPlus className="h-4 w-4 mr-2" />
      Add Friend
    </Button>
  );
}
