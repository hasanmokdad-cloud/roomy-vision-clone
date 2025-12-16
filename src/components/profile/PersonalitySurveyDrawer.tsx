import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Brain, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface PersonalitySurveyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onComplete: () => void;
  existingAnswers?: any;
}

interface PersonalityAnswers {
  personality_sleep_schedule: string;
  personality_noise_tolerance: string;
  personality_guests_frequency: string;
  personality_cleanliness_level: string;
  personality_shared_space_cleanliness_importance: number;
  personality_study_time: string;
  personality_study_environment: string;
  personality_sleep_sensitivity: string;
  personality_intro_extro: string;
  personality_conflict_style: string;
  personality_sharing_preferences: string;
  personality_smoking: string;
  personality_cooking_frequency: string;
}

const STORAGE_KEY_PREFIX = 'roomy_survey_progress_';

export function PersonalitySurveyDrawer({ 
  open, 
  onOpenChange, 
  userId, 
  onComplete,
  existingAnswers 
}: PersonalitySurveyDrawerProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [answers, setAnswers] = useState<Partial<PersonalityAnswers>>({
    personality_shared_space_cleanliness_importance: 3
  });

  // Load saved progress on mount
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers || {});
          setCurrentStep(parsed.step || 0);
        } catch (e) {
          console.error('Error parsing saved survey progress:', e);
        }
      } else if (existingAnswers?.personality_test_completed) {
        // Load existing answers for editing
        setAnswers({
          personality_sleep_schedule: existingAnswers.personality_sleep_schedule,
          personality_noise_tolerance: existingAnswers.personality_noise_tolerance,
          personality_guests_frequency: existingAnswers.personality_guests_frequency,
          personality_cleanliness_level: existingAnswers.personality_cleanliness_level,
          personality_shared_space_cleanliness_importance: existingAnswers.personality_shared_space_cleanliness_importance || 3,
          personality_study_time: existingAnswers.personality_study_time,
          personality_study_environment: existingAnswers.personality_study_environment,
          personality_sleep_sensitivity: existingAnswers.personality_sleep_sensitivity,
          personality_intro_extro: existingAnswers.personality_intro_extro,
          personality_conflict_style: existingAnswers.personality_conflict_style,
          personality_sharing_preferences: existingAnswers.personality_sharing_preferences,
          personality_smoking: existingAnswers.personality_smoking,
          personality_cooking_frequency: existingAnswers.personality_cooking_frequency,
        });
      }
    }
  }, [open, userId, existingAnswers]);

  // Save progress when answers or step changes
  useEffect(() => {
    if (open && Object.keys(answers).length > 1) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify({
        answers,
        step: currentStep,
      }));
    }
  }, [answers, currentStep, userId, open]);

  const questions = [
    {
      section: "Lifestyle & Daily Rhythm",
      questions: [
        {
          id: "personality_sleep_schedule",
          question: "What's your typical sleep schedule?",
          type: "radio",
          options: [
            { value: "early", label: "Early bird (bed by 10 PM)" },
            { value: "regular", label: "Regular (bed by midnight)" },
            { value: "late", label: "Night owl (bed after midnight)" }
          ]
        },
        {
          id: "personality_noise_tolerance",
          question: "How much noise can you tolerate?",
          type: "radio",
          options: [
            { value: "very_quiet", label: "Very quiet - I need silence" },
            { value: "quiet", label: "Quiet - minimal noise okay" },
            { value: "normal", label: "Normal - typical sounds fine" },
            { value: "loud", label: "Loud - noise doesn't bother me" }
          ]
        },
        {
          id: "personality_guests_frequency",
          question: "How often do you have guests?",
          type: "radio",
          options: [
            { value: "never", label: "Never or very rarely" },
            { value: "rarely", label: "Once a month" },
            { value: "sometimes", label: "A few times a month" },
            { value: "often", label: "Weekly or more" }
          ]
        },
        {
          id: "personality_cleanliness_level",
          question: "Your cleanliness level?",
          type: "radio",
          options: [
            { value: "very_clean", label: "Very clean - daily cleaning" },
            { value: "clean", label: "Clean - regular tidying" },
            { value: "average", label: "Average - clean when needed" },
            { value: "messy", label: "Relaxed - not a priority" }
          ]
        },
        {
          id: "personality_shared_space_cleanliness_importance",
          question: "Importance of clean shared spaces?",
          type: "slider",
          min: 1,
          max: 5,
          labels: ["Not important", "Very important"]
        }
      ]
    },
    {
      section: "Study & Work Style",
      questions: [
        {
          id: "personality_study_time",
          question: "When do you study or work?",
          type: "radio",
          options: [
            { value: "morning", label: "Morning (before noon)" },
            { value: "afternoon", label: "Afternoon (noon to 6 PM)" },
            { value: "evening", label: "Evening (6 PM to midnight)" },
            { value: "late_night", label: "Late night (after midnight)" }
          ]
        },
        {
          id: "personality_study_environment",
          question: "Preferred study environment?",
          type: "radio",
          options: [
            { value: "silent", label: "Complete silence" },
            { value: "quiet", label: "Quiet with minimal noise" },
            { value: "moderate_noise", label: "Moderate noise okay" },
            { value: "flexible", label: "Flexible - I can adapt" }
          ]
        },
        {
          id: "personality_sleep_sensitivity",
          question: "How easily does noise wake you?",
          type: "radio",
          options: [
            { value: "very_light", label: "Very light - any noise wakes me" },
            { value: "light", label: "Light - small noises disturb me" },
            { value: "normal", label: "Normal - only loud noises" },
            { value: "heavy", label: "Heavy - I sleep through anything" }
          ]
        }
      ]
    },
    {
      section: "Social & Compatibility",
      questions: [
        {
          id: "personality_intro_extro",
          question: "Your social energy?",
          type: "radio",
          options: [
            { value: "introvert", label: "Introvert - I recharge alone" },
            { value: "ambivert", label: "Ambivert - balanced" },
            { value: "extrovert", label: "Extrovert - thrive around people" }
          ]
        },
        {
          id: "personality_conflict_style",
          question: "How do you handle conflicts?",
          type: "radio",
          options: [
            { value: "avoidant", label: "Prefer to avoid conflicts" },
            { value: "direct", label: "Address issues directly" },
            { value: "compromise", label: "Seek compromise" },
            { value: "assertive", label: "Assertive but respectful" }
          ]
        },
        {
          id: "personality_sharing_preferences",
          question: "Comfort sharing personal items?",
          type: "radio",
          options: [
            { value: "minimal", label: "Minimal - keep things separate" },
            { value: "moderate", label: "Moderate - some sharing okay" },
            { value: "anything_shared", label: "Open - happy to share" }
          ]
        }
      ]
    },
    {
      section: "Habits",
      questions: [
        {
          id: "personality_smoking",
          question: "Do you smoke?",
          type: "radio",
          options: [
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" }
          ]
        },
        {
          id: "personality_cooking_frequency",
          question: "How often do you cook?",
          type: "radio",
          options: [
            { value: "never", label: "Never - I eat out" },
            { value: "rarely", label: "Rarely - once a week or less" },
            { value: "sometimes", label: "Sometimes - few times a week" },
            { value: "often", label: "Often - daily or almost" }
          ]
        }
      ]
    }
  ];

  const currentSection = questions[currentStep];
  const totalSteps = questions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleAnswer = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const isStepComplete = () => {
    return currentSection.questions.every(q => answers[q.id as keyof PersonalityAnswers] !== undefined);
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const computePersonalityVector = (answers: Partial<PersonalityAnswers>) => {
    const vector: Record<string, number> = {};
    
    const sleepMap = { early: 0, regular: 0.5, late: 1 };
    vector.sleep_schedule = sleepMap[answers.personality_sleep_schedule as keyof typeof sleepMap] ?? 0.5;
    
    const noiseMap = { very_quiet: 0, quiet: 0.33, normal: 0.66, loud: 1 };
    vector.noise_tolerance = noiseMap[answers.personality_noise_tolerance as keyof typeof noiseMap] ?? 0.5;
    
    const guestsMap = { never: 0, rarely: 0.33, sometimes: 0.66, often: 1 };
    vector.guests_frequency = guestsMap[answers.personality_guests_frequency as keyof typeof guestsMap] ?? 0.5;
    
    const cleanMap = { very_clean: 1, clean: 0.75, average: 0.5, messy: 0.25 };
    vector.cleanliness_level = cleanMap[answers.personality_cleanliness_level as keyof typeof cleanMap] ?? 0.5;
    
    vector.shared_space_importance = ((answers.personality_shared_space_cleanliness_importance || 3) - 1) / 4;
    
    const socialMap = { introvert: 0, ambivert: 0.5, extrovert: 1 };
    vector.social_energy = socialMap[answers.personality_intro_extro as keyof typeof socialMap] ?? 0.5;
    
    vector.smoking = answers.personality_smoking === 'yes' ? 1 : 0;
    
    return vector;
  };

  const handleSubmit = async () => {
    if (!isStepComplete()) {
      toast({
        title: "Incomplete",
        description: "Please answer all questions",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const personalityVector = computePersonalityVector(answers);

      const { data: studentData, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (fetchError || !studentData) {
        throw new Error('Student profile not found');
      }

      const { error: updateError } = await supabase
        .from('students')
        .update({
          ...answers,
          personality_test_completed: true,
          personality_vector: personalityVector,
          personality_last_updated_at: new Date().toISOString()
        })
        .eq('id', studentData.id);

      if (updateError) throw updateError;

      // Clear saved progress
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);

      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving personality survey:', error);
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Progress is auto-saved, just close
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <DrawerHeader className="border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <DrawerTitle className="text-lg">Personality Survey</DrawerTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-primary font-semibold">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{currentSection.section}</p>
          </div>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {currentSection.questions.map((question) => (
              <div key={question.id} className="space-y-3">
                <Label className="text-base font-semibold">
                  {question.question}
                </Label>
                
                {question.type === "radio" && (
                  <RadioGroup
                    value={answers[question.id as keyof PersonalityAnswers] as string || ""}
                    onValueChange={(value) => handleAnswer(question.id, value)}
                  >
                    <div className="space-y-2">
                      {question.options?.map((option) => (
                        <div 
                          key={option.value} 
                          className={`flex items-center space-x-3 p-3 border rounded-xl transition-colors ${
                            answers[question.id as keyof PersonalityAnswers] === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border/40 hover:bg-muted/30'
                          }`}
                        >
                          <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                          <Label 
                            htmlFor={`${question.id}-${option.value}`} 
                            className="flex-1 cursor-pointer text-sm"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {question.type === "slider" && (
                  <div className="space-y-4 pt-2">
                    <Slider
                      value={[answers[question.id as keyof PersonalityAnswers] as number || 3]}
                      onValueChange={(value) => handleAnswer(question.id, value[0])}
                      min={question.min}
                      max={question.max}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{question.labels?.[0]}</span>
                      <span className="font-bold text-lg text-foreground">
                        {answers[question.id as keyof PersonalityAnswers] || 3}
                      </span>
                      <span>{question.labels?.[1]}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-border/40 p-4 shrink-0">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex-1 py-6"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {currentStep < totalSteps - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepComplete()}
                className="flex-1 py-6 bg-gradient-to-r from-primary to-secondary"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepComplete() || saving}
                className="flex-1 py-6 bg-gradient-to-r from-primary to-secondary"
              >
                {saving ? "Saving..." : (
                  <>
                    Complete
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
