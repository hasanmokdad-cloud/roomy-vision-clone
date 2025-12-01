import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageCircle, MoreVertical, UserX, Ban, Users, User } from 'lucide-react';
import { useMutualFriends } from '@/hooks/useMutualFriends';
import type { Friendship } from '@/hooks/useFriendships';

interface FriendCardProps {
  friendship: Friendship;
  currentStudentId: string;
  onMessage: (studentId: string) => void;
  onRemove: (friendshipId: string) => void;
  onBlock: (friendshipId: string, userToBlock: string) => void;
  onViewProfile: (studentId: string) => void;
  onMutualFriendsClick: (studentId: string, otherStudentId: string) => void;
}

export function FriendCard({
  friendship,
  currentStudentId,
  onMessage,
  onRemove,
  onBlock,
  onViewProfile,
  onMutualFriendsClick,
}: FriendCardProps) {
  const friend =
    friendship.requester_id === currentStudentId
      ? friendship.receiver
      : friendship.requester;

  const { count: mutualCount } = useMutualFriends(
    currentStudentId,
    friend?.id || null
  );

  if (!friend) return null;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={friend.profile_photo_url || undefined} />
          <AvatarFallback>
            {friend.full_name
              .split(' ')
              .map(n => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-foreground">{friend.full_name}</h4>
              {friend.username && (
                <p className="text-sm text-muted-foreground">@{friend.username}</p>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0">
              Friend
            </Badge>
          </div>

          <div className="mt-1 space-y-1">
            {friend.university && (
              <p className="text-sm text-muted-foreground">{friend.university}</p>
            )}
            {friend.major && (
              <p className="text-sm text-muted-foreground">
                {friend.major}
                {friend.year_of_study && ` • Year ${friend.year_of_study}`}
              </p>
            )}
          </div>

          {mutualCount > 0 && (
            <Badge
              variant="outline"
              className="mt-2 cursor-pointer hover:bg-accent"
              onClick={() => onMutualFriendsClick(currentStudentId, friend.id)}
            >
              <Users className="h-3 w-3 mr-1" />
              {mutualCount} mutual friend{mutualCount !== 1 ? 's' : ''}
            </Badge>
          )}

          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="default"
              onClick={() => onMessage(friend.id)}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewProfile(friend.id)}>
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRemove(friendship.id)}
                  className="text-destructive"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Remove Friend
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onBlock(friendship.id, friend.id)}
                  className="text-destructive"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}
