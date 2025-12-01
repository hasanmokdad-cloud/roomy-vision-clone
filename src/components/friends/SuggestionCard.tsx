import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, Home, GraduationCap, BookOpen } from 'lucide-react';
import type { FriendSuggestion } from '@/hooks/useFriendSuggestions';

interface SuggestionCardProps {
  suggestion: FriendSuggestion;
  currentStudentId: string;
  onAddFriend: (studentId: string) => void;
  onMutualFriendsClick: (studentId: string, otherStudentId: string) => void;
  isRequestSent?: boolean;
}

export function SuggestionCard({
  suggestion,
  currentStudentId,
  onAddFriend,
  onMutualFriendsClick,
  isRequestSent = false,
}: SuggestionCardProps) {
  const getMatchIcon = () => {
    switch (suggestion.match_reason) {
      case 'same_dorm':
        return <Home className="h-3 w-3" />;
      case 'same_major':
        return <BookOpen className="h-3 w-3" />;
      case 'same_university':
        return <GraduationCap className="h-3 w-3" />;
    }
  };

  const getMatchText = () => {
    switch (suggestion.match_reason) {
      case 'same_dorm':
        return suggestion.dorm ? `Lives in ${suggestion.dorm.name}` : 'Same dorm';
      case 'same_major':
        return `Same major: ${suggestion.major}`;
      case 'same_university':
        return `Same university: ${suggestion.university}`;
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={suggestion.profile_photo_url || undefined} />
          <AvatarFallback>
            {suggestion.full_name
              .split(' ')
              .map(n => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-foreground">
                {suggestion.full_name}
              </h4>
              {suggestion.username && (
                <p className="text-sm text-muted-foreground">
                  @{suggestion.username}
                </p>
              )}
            </div>
          </div>

          <div className="mt-1 space-y-1">
            {suggestion.university && (
              <p className="text-sm text-muted-foreground">
                {suggestion.university}
              </p>
            )}
            {suggestion.major && (
              <p className="text-sm text-muted-foreground">
                {suggestion.major}
                {suggestion.year_of_study && ` • Year ${suggestion.year_of_study}`}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {getMatchIcon()}
              <span className="ml-1">{getMatchText()}</span>
            </Badge>

            {suggestion.mutual_friends_count > 0 && (
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-accent"
                onClick={() =>
                  onMutualFriendsClick(currentStudentId, suggestion.id)
                }
              >
                <Users className="h-3 w-3 mr-1" />
                {suggestion.mutual_friends_count} mutual
              </Badge>
            )}
          </div>

          <Button
            size="sm"
            variant={isRequestSent ? 'outline' : 'default'}
            onClick={() => onAddFriend(suggestion.id)}
            disabled={isRequestSent}
            className="w-full mt-3"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {isRequestSent ? 'Request Sent' : 'Add Friend'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
