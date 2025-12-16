import { User, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { StudentProfile } from './ProfileHub';

interface ProfileHubHeaderProps {
  profile: StudentProfile | null;
}

export function ProfileHubHeader({ profile }: ProfileHubHeaderProps) {
  // Calculate completion
  const completionItems = [
    {
      label: 'Academic Info',
      completed: !!(profile?.university && profile?.year_of_study),
    },
    {
      label: 'Preferences',
      completed: !!(profile?.preferred_housing_area && profile?.room_type && profile?.budget),
    },
    {
      label: 'Accommodation',
      completed: profile?.accommodation_status !== null && profile?.accommodation_status !== undefined,
    },
    {
      label: 'Personality',
      completed: !!profile?.personality_test_completed,
    },
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const totalCount = completionItems.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-5">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar className="w-16 h-16 border-2 border-background shadow-lg">
          <AvatarImage src={profile?.profile_photo_url || undefined} />
          <AvatarFallback className="bg-muted text-xl">
            {profile?.full_name?.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">
            {profile?.full_name || 'Welcome!'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Update your info and improve matches
          </p>
        </div>
      </div>

      {/* Completion Indicator */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Profile setup</span>
          <span className="text-sm font-semibold text-primary">{percentage}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-2 gap-2">
          {completionItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${item.completed ? 'text-green-500' : 'text-muted-foreground/30'}`}
              />
              <span className={`text-xs ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
