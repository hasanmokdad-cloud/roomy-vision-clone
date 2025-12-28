import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Users } from 'lucide-react';
import { useMutualFriends } from '@/hooks/useMutualFriends';
import type { Friendship } from '@/hooks/useFriendships';

interface FriendRequestCardProps {
  friendship: Friendship;
  currentStudentId: string;
  onAccept: (friendshipId: string) => void;
  onReject: (friendshipId: string) => void;
  onMutualFriendsClick: (studentId: string, otherStudentId: string) => void;
  highlightStudentId?: string | null;
}

export function FriendRequestCard({
  friendship,
  currentStudentId,
  onAccept,
  onReject,
  onMutualFriendsClick,
  highlightStudentId,
}: FriendRequestCardProps) {
  const requester = friendship.requester;
  const { count: mutualCount } = useMutualFriends(
    currentStudentId,
    requester?.id || null
  );
  
  const isHighlighted = highlightStudentId === requester?.id;
  console.log('[FriendRequestCard] highlightStudentId:', highlightStudentId, 'requester.id:', requester?.id, 'isHighlighted:', isHighlighted);

  if (!requester) return null;

  return (
    <Card className={`p-4 hover:shadow-md transition-all ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 animate-pulse' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={requester.profile_photo_url || undefined} />
          <AvatarFallback>
            {requester.full_name
              .split(' ')
              .map(n => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-foreground">
                {requester.full_name}
              </h4>
              {requester.username && (
                <p className="text-sm text-muted-foreground">@{requester.username}</p>
              )}
            </div>
          </div>

          <div className="mt-1 space-y-1">
            {requester.university && (
              <p className="text-sm text-muted-foreground">{requester.university}</p>
            )}
            {requester.major && (
              <p className="text-sm text-muted-foreground">
                {requester.major}
                {requester.year_of_study && ` • Year ${requester.year_of_study}`}
              </p>
            )}
          </div>

          {mutualCount > 0 && (
            <Badge
              variant="secondary"
              className="mt-2 cursor-pointer hover:bg-secondary/80"
              onClick={() =>
                onMutualFriendsClick(currentStudentId, requester.id)
              }
            >
              <Users className="h-3 w-3 mr-1" />
              {mutualCount} mutual friend{mutualCount !== 1 ? 's' : ''}
            </Badge>
          )}

          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => onAccept(friendship.id)}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(friendship.id)}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
