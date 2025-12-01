import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutualFriends } from '@/hooks/useMutualFriends';
import { Home } from 'lucide-react';

interface MutualFriendsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentIdA: string;
  studentIdB: string;
}

export function MutualFriendsModal({
  open,
  onOpenChange,
  studentIdA,
  studentIdB,
}: MutualFriendsModalProps) {
  const { mutualFriends, count, loading } = useMutualFriends(
    studentIdA,
    studentIdB
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Mutual Friends ({count})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : mutualFriends.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No mutual friends yet
            </p>
          ) : (
            <div className="space-y-3">
              {mutualFriends.map(friend => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
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
                    <p className="font-medium text-foreground">
                      {friend.full_name}
                    </p>
                    {friend.username && (
                      <p className="text-sm text-muted-foreground">
                        @{friend.username}
                      </p>
                    )}
                    {friend.university && (
                      <p className="text-xs text-muted-foreground">
                        {friend.university}
                      </p>
                    )}
                    {friend.dorm && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Home className="h-3 w-3" />
                        {friend.dorm.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
