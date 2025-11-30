import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Brain, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PersonalitySurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onComplete: () => void;
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

export const PersonalitySurveyModal = ({ open, onOpenChange, userId, onComplete }: PersonalitySurveyModalProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [answers, setAnswers] = useState<Partial<PersonalityAnswers>>({
    personality_shared_space_cleanliness_importance: 3
  });

  const questions = [
    // Lifestyle & Daily Rhythm
    {
      section: "Lifestyle & Daily Rhythm",
      questions: [
        {
          id: "personality_sleep_schedule",
          question: "What's your typical sleep schedule?",
          type: "radio",
          options: [
            { value: "early", label: "Early bird (bed by 10 PM, up by 7 AM)" },
            { value: "regular", label: "Regular schedule (bed by midnight, up by 8 AM)" },
            { value: "late", label: "Night owl (bed after midnight, up after 9 AM)" }
          ]
        },
        {
          id: "personality_noise_tolerance",
          question: "How much noise can you tolerate at home?",
          type: "radio",
          options: [
            { value: "very_quiet", label: "Very quiet - I need silence" },
            { value: "quiet", label: "Quiet - minimal noise is okay" },
            { value: "normal", label: "Normal - typical household sounds are fine" },
            { value: "loud", label: "Loud - I don't mind noise at all" }
          ]
        },
        {
          id: "personality_guests_frequency",
          question: "How often do you have guests over?",
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
          question: "How would you describe your cleanliness level?",
          type: "radio",
          options: [
            { value: "very_clean", label: "Very clean - I clean daily" },
            { value: "clean", label: "Clean - I tidy up regularly" },
            { value: "average", label: "Average - I clean when needed" },
            { value: "messy", label: "Relaxed - cleaning isn't my priority" }
          ]
        },
        {
          id: "personality_shared_space_cleanliness_importance",
          question: "How important is it that shared spaces stay clean?",
          type: "slider",
          min: 1,
          max: 5,
          labels: ["Not important", "Very important"]
        }
      ]
    },
    // Study & Work Style
    {
      section: "Study & Work Style",
      questions: [
        {
          id: "personality_study_time",
          question: "When do you typically study or work?",
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
          question: "What study environment do you prefer?",
          type: "radio",
          options: [
            { value: "silent", label: "Complete silence" },
            { value: "quiet", label: "Quiet with minimal background noise" },
            { value: "moderate_noise", label: "Moderate noise is okay" },
            { value: "flexible", label: "Flexible - I can adapt" }
          ]
        },
        {
          id: "personality_sleep_sensitivity",
          question: "How easily does noise wake you up?",
          type: "radio",
          options: [
            { value: "very_light", label: "Very light - any noise wakes me" },
            { value: "light", label: "Light - small noises disturb me" },
            { value: "normal", label: "Normal - only loud noises wake me" },
            { value: "heavy", label: "Heavy - I sleep through anything" }
          ]
        }
      ]
    },
    // Social & Compatibility
    {
      section: "Social & Compatibility",
      questions: [
        {
          id: "personality_intro_extro",
          question: "How would you describe your social energy?",
          type: "radio",
          options: [
            { value: "introvert", label: "Introvert - I recharge alone" },
            { value: "ambivert", label: "Ambivert - balanced social needs" },
            { value: "extrovert", label: "Extrovert - I thrive around people" }
          ]
        },
        {
          id: "personality_conflict_style",
          question: "How do you handle conflicts or disagreements?",
          type: "radio",
          options: [
            { value: "avoidant", label: "I prefer to avoid conflicts" },
            { value: "direct", label: "I address issues directly" },
            { value: "compromise", label: "I seek compromise and middle ground" },
            { value: "assertive", label: "I'm assertive but respectful" }
          ]
        },
        {
          id: "personality_sharing_preferences",
          question: "How comfortable are you sharing personal items?",
          type: "radio",
          options: [
            { value: "minimal", label: "Minimal - I keep things separate" },
            { value: "moderate", label: "Moderate - some sharing is okay" },
            { value: "anything_shared", label: "Open - happy to share most things" }
          ]
        }
      ]
    },
    // Habits
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
          question: "How often do you cook at home?",
          type: "radio",
          options: [
            { value: "never", label: "Never - I eat out" },
            { value: "rarely", label: "Rarely - once a week or less" },
            { value: "sometimes", label: "Sometimes - a few times a week" },
            { value: "often", label: "Often - daily or almost daily" }
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
    // Create a normalized vector for ML/matching purposes
    const vector: Record<string, number> = {};
    
    // Sleep schedule: early=0, regular=0.5, late=1
    const sleepMap = { early: 0, regular: 0.5, late: 1 };
    vector.sleep_schedule = sleepMap[answers.personality_sleep_schedule as keyof typeof sleepMap] ?? 0.5;
    
    // Noise tolerance: very_quiet=0, quiet=0.33, normal=0.66, loud=1
    const noiseMap = { very_quiet: 0, quiet: 0.33, normal: 0.66, loud: 1 };
    vector.noise_tolerance = noiseMap[answers.personality_noise_tolerance as keyof typeof noiseMap] ?? 0.5;
    
    // Guests frequency: never=0, rarely=0.33, sometimes=0.66, often=1
    const guestsMap = { never: 0, rarely: 0.33, sometimes: 0.66, often: 1 };
    vector.guests_frequency = guestsMap[answers.personality_guests_frequency as keyof typeof guestsMap] ?? 0.5;
    
    // Cleanliness: very_clean=1, clean=0.75, average=0.5, messy=0.25
    const cleanMap = { very_clean: 1, clean: 0.75, average: 0.5, messy: 0.25 };
    vector.cleanliness_level = cleanMap[answers.personality_cleanliness_level as keyof typeof cleanMap] ?? 0.5;
    
    // Shared space importance: 1-5 scale, normalize to 0-1
    vector.shared_space_importance = ((answers.personality_shared_space_cleanliness_importance || 3) - 1) / 4;
    
    // Intro/extro: introvert=0, ambivert=0.5, extrovert=1
    const socialMap = { introvert: 0, ambivert: 0.5, extrovert: 1 };
    vector.social_energy = socialMap[answers.personality_intro_extro as keyof typeof socialMap] ?? 0.5;
    
    // Smoking: no=0, yes=1
    vector.smoking = answers.personality_smoking === 'yes' ? 1 : 0;
    
    return vector;
  };

  const handleSubmit = async () => {
    if (!isStepComplete()) {
      toast({
        title: "Incomplete",
        description: "Please answer all questions before continuing",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Compute personality vector
      const personalityVector = computePersonalityVector(answers);

      // Save to database
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

      toast({
        title: "Success!",
        description: "Your personality preferences have been saved"
      });

      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving personality survey:', error);
      toast({
        title: "Error",
        description: "Failed to save your answers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Personality Matching Survey
          </DialogTitle>
          <DialogDescription>
            {currentSection.section} • Step {currentStep + 1} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {Math.round(progress)}% complete
            </p>
          </div>

          {/* Questions */}
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
                        <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                          <Label htmlFor={`${question.id}-${option.value}`} className="flex-1 cursor-pointer">
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
                      <span className="font-bold text-base text-foreground">
                        {answers[question.id as keyof PersonalityAnswers] || 3}
                      </span>
                      <span>{question.labels?.[1]}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {currentStep < totalSteps - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepComplete()}
                className="flex-1"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepComplete() || saving}
                className="flex-1"
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
      </DialogContent>
    </Dialog>
  );
};