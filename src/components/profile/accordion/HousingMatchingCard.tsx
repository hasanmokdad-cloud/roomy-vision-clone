import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Home, MapPin, Users, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { StudentProfile } from '../ProfileHub';

interface HousingMatchingCardProps {
  profile: StudentProfile | null;
  onEditPreferences: () => void;
  onTakeSurvey: () => void;
  onFindMatches: () => void;
}

export function HousingMatchingCard({
  profile,
  onEditPreferences,
  onTakeSurvey,
  onFindMatches,
}: HousingMatchingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSurveyStatus = () => {
    if (profile?.personality_test_completed) return 'Completed';
    // Check localStorage for in-progress survey
    const savedProgress = localStorage.getItem(`roomy_survey_progress_${profile?.id}`);
    if (savedProgress) return 'In progress';
    return 'Not started';
  };

  const surveyStatus = getSurveyStatus();

  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between active:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Home className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-foreground">Housing & Matching</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsed Summary */}
      {!isExpanded && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            {profile?.preferred_housing_area || 'Area: Not set'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Home className="w-3 h-3 mr-1" />
            {profile?.room_type || 'Room: Not set'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            Roommate: {profile?.need_roommate ? 'Yes' : 'No'}
          </Badge>
          <Badge 
            variant={surveyStatus === 'Completed' ? 'default' : 'secondary'} 
            className={`text-xs ${surveyStatus === 'Completed' ? 'bg-green-500/20 text-green-600' : ''}`}
          >
            <Brain className="w-3 h-3 mr-1" />
            Survey: {surveyStatus}
          </Badge>
        </div>
      )}

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border/30"
          >
            <div className="p-4 space-y-6">
              {/* A) Housing Preferences Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Housing Preferences</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Monthly Budget</p>
                    <p className="font-medium text-foreground">
                      {profile?.budget ? `$${profile.budget}` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Preferred Area</p>
                    <p className="font-medium text-foreground">
                      {profile?.preferred_housing_area || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Room Type</p>
                    <p className="font-medium text-foreground">
                      {profile?.room_type || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Need Roommate</p>
                    <p className="font-medium text-foreground">
                      {profile?.need_roommate ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={onEditPreferences}
                  className="w-full"
                >
                  Edit Preferences
                </Button>
              </div>

              {/* B) Personality Matching Card */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">Personality Matching (Optional)</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended for better roommate compatibility
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Enable Personality Matching</span>
                  <Switch
                    checked={!!profile?.enable_personality_matching}
                    disabled // Toggle is handled via preferences page
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    Survey status: 
                    <span className={`ml-1 font-medium ${
                      surveyStatus === 'Completed' ? 'text-green-500' : 
                      surveyStatus === 'In progress' ? 'text-yellow-500' : 
                      'text-muted-foreground'
                    }`}>
                      {surveyStatus}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant={surveyStatus === 'Completed' ? 'outline' : 'default'}
                    onClick={onTakeSurvey}
                    className={surveyStatus !== 'Completed' ? 'bg-gradient-to-r from-primary to-secondary' : ''}
                  >
                    {surveyStatus === 'Completed' ? 'Edit Survey' : 'Take Survey'}
                  </Button>
                </div>
              </div>

              {/* C) Matching Action */}
              <div className="space-y-2">
                <Button
                  onClick={onFindMatches}
                  className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-primary to-secondary"
                >
                  Find Matches
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Find dorms and roommate matches based on your preferences
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
