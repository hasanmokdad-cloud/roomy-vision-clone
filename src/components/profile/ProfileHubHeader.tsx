import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CheckCircle2, Crown, Shield, Pencil, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { StudentProfile } from './ProfileHub';
import type { AiMatchPlan } from '@/utils/tierLogic';
import { ProfileVisibilityNotice } from './ProfileVisibilityNotice';

interface ProfileHubHeaderProps {
  profile: StudentProfile | null;
  userId?: string;
}

export function ProfileHubHeader({ profile, userId }: ProfileHubHeaderProps) {
  const navigate = useNavigate();
  const [userPlan, setUserPlan] = useState<AiMatchPlan>('basic');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchPlanAndVerification = async () => {
      // Fetch plan from students table
      const { data: student } = await supabase
        .from('students')
        .select('ai_match_plan')
        .eq('user_id', userId)
        .single();

      if (student) {
        setUserPlan((student.ai_match_plan as AiMatchPlan) || 'basic');
      }

      // Check if user email is verified via auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        setIsVerified(true);
      }
    };

    fetchPlanAndVerification();
  }, [userId]);

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

  // Role badge
  const getRoleBadge = () => {
    return (
      <Badge variant="outline" className="text-xs gap-1 bg-primary/5 border-primary/30 text-primary">
        <User className="w-3 h-3" />
        Student
      </Badge>
    );
  };

  // Plan status chip
  const getPlanChip = () => {
    if (userPlan === 'vip') {
      return (
        <Badge className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-600 border-amber-400/50 gap-1">
          <Crown className="w-3 h-3" />
          VIP
        </Badge>
      );
    }
    if (userPlan === 'advanced') {
      return (
        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1">
          <Shield className="w-3 h-3" />
          Advanced
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border/40 rounded-2xl p-5 relative">
      {/* Edit Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-8 w-8 rounded-full"
        onClick={() => navigate('/profile/complete')}
      >
        <Pencil className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar className="w-16 h-16 border-2 border-background shadow-lg">
          <AvatarImage src={profile?.profile_photo_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xl">
            {profile?.full_name?.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {profile?.full_name || 'Welcome!'}
          </h2>
          
          {/* Role Badge */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {getRoleBadge()}
            {isVerified && (
              <Badge variant="outline" className="text-xs gap-1 bg-green-500/10 border-green-500/30 text-green-600">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </Badge>
            )}
            {getPlanChip()}
          </div>
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

      {/* Profile Visibility Notice */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <ProfileVisibilityNotice />
      </div>
    </div>
  );
}
