import { useState } from 'react';
import { Sparkles, CheckCircle2, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PersonalityMatchingCardProps {
  userId: string;
  personalityCompleted: boolean;
  personalityEnabled: boolean;
  surveyProgress?: number;
  onTakeSurvey: () => void;
  onProfileUpdated: () => void;
}

export function PersonalityMatchingCard({
  userId,
  personalityCompleted,
  personalityEnabled,
  surveyProgress = 0,
  onTakeSurvey,
  onProfileUpdated,
}: PersonalityMatchingCardProps) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(personalityEnabled);
  const [updating, setUpdating] = useState(false);

  const handleToggle = async () => {
    setUpdating(true);
    try {
      const newValue = !enabled;
      const { error } = await supabase
        .from('students')
        .update({ enable_personality_matching: newValue })
        .eq('user_id', userId);

      if (error) throw error;

      setEnabled(newValue);
      onProfileUpdated();
      toast({
        title: newValue ? 'Personality matching enabled' : 'Personality matching disabled',
        description: newValue
          ? 'You\'ll get better roommate matches'
          : 'Basic matching only',
      });
    } catch (err) {
      console.error('Error updating setting:', err);
      toast({
        title: 'Error',
        description: 'Could not update setting',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Determine state
  const inProgress = surveyProgress > 0 && surveyProgress < 100 && !personalityCompleted;

  return (
    <div className="bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 rounded-2xl border border-border/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Personality Matching</h3>
            <p className="text-xs text-muted-foreground">Better roommate compatibility</p>
          </div>
        </div>

        {/* Status Badge */}
        {personalityCompleted ? (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Done
          </Badge>
        ) : inProgress ? (
          <Badge variant="outline" className="text-xs">
            {surveyProgress}%
          </Badge>
        ) : null}
      </div>

      {/* Progress bar for in-progress */}
      {inProgress && (
        <div className="mt-3">
          <Progress value={surveyProgress} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">Survey in progress</p>
        </div>
      )}

      {/* Toggle Section */}
      <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
        <span className="text-sm text-foreground">Enable personality matching</span>
        <button
          onClick={handleToggle}
          disabled={updating}
          className="focus:outline-none disabled:opacity-50"
        >
          {enabled ? (
            <ToggleRight className="w-8 h-8 text-primary" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* CTA Button */}
      <Button
        onClick={onTakeSurvey}
        className="w-full mt-4 gap-2"
        variant={personalityCompleted ? 'outline' : 'default'}
      >
        {personalityCompleted ? 'Edit Survey' : inProgress ? 'Continue Survey' : 'Take Survey'}
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
