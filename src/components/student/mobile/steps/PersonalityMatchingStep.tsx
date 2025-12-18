import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonalitySurveyModal } from '@/components/profile/PersonalitySurveyModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PersonalityMatchingStepProps {
  onSurveyComplete?: () => void;
}

const PersonalityMatchingStep = ({ onSurveyComplete }: PersonalityMatchingStepProps) => {
  const { user } = useAuth();
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  useEffect(() => {
    const checkSurveyStatus = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('students')
        .select('personality_test_completed')
        .eq('user_id', user.id)
        .single();
      
      if (data?.personality_test_completed) {
        setSurveyCompleted(true);
      }
    };

    checkSurveyStatus();
  }, [user?.id]);

  const handleSurveyComplete = () => {
    setSurveyCompleted(true);
    onSurveyComplete?.();
  };

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Personality Matching
          </h2>
          <p className="text-muted-foreground">
            Complete a quick survey to find roommates with compatible habits
          </p>
        </div>

        {surveyCompleted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/5 border-2 border-primary rounded-2xl p-6 text-center"
          >
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Survey Complete!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your personality preferences have been saved
            </p>
            <Button
              variant="outline"
              onClick={() => setShowSurvey(true)}
              className="text-sm"
            >
              Retake Survey
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSurvey(true)}
              className="w-full p-6 rounded-2xl border-2 border-primary bg-primary/5 flex items-center gap-4 transition-all hover:bg-primary/10"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div className="text-left flex-1">
                <span className="font-semibold text-foreground block text-lg">
                  Take Personality Survey
                </span>
                <span className="text-sm text-muted-foreground">
                  13 quick questions about your lifestyle
                </span>
              </div>
            </motion.button>

            <p className="text-center text-sm text-muted-foreground">
              You can also skip this for now and complete it later from your profile
            </p>
          </div>
        )}

        {user?.id && (
          <PersonalitySurveyModal
            open={showSurvey}
            onOpenChange={setShowSurvey}
            userId={user.id}
            onComplete={handleSurveyComplete}
          />
        )}
      </motion.div>
    </div>
  );
};

export default PersonalityMatchingStep;
