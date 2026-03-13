import { useState, useEffect } from "react";
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
  openedFrom?: 'wizard' | 'profile';
}

interface PersonalityAnswers {
  // Step 1: Lifestyle & Daily Rhythm
  personality_sleep_schedule: string;
  personality_noise_tolerance: string;
  personality_guests_frequency: string;
  personality_partner_overnight: string;
  personality_cleanliness_level: string;
  personality_shared_space_cleanliness_importance: number;
  // Step 2: Work & Daily Routine
  personality_study_time: string;
  personality_home_frequency: string;
  // Step 3: Social & Compatibility
  personality_intro_extro: string;
  personality_conflict_style: string;
  personality_conflict_address_method: string;
  personality_sharing_preferences: string;
  // Step 4: Habits & Preferences
  personality_smoking: string;
  personality_cooking_frequency: string;
  personality_expense_handling: string;
  // Step 5: Pets & Dealbreakers
  personality_pet_ownership: string;
  personality_pet_comfort: string;
}

export const PersonalitySurveyModal = ({ open, onOpenChange, userId, onComplete, openedFrom = 'wizard' }: PersonalitySurveyModalProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [answers, setAnswers] = useState<Partial<PersonalityAnswers>>({
    personality_shared_space_cleanliness_importance: 3
  });

  // Pre-fill answers from DB when opened from profile
  useEffect(() => {
    if (open && openedFrom === 'profile') {
      const loadExistingAnswers = async () => {
        const { data } = await supabase
          .from('students')
          .select('personality_sleep_schedule, personality_noise_tolerance, personality_guests_frequency, personality_partner_overnight, personality_cleanliness_level, personality_shared_space_cleanliness_importance, personality_study_time, personality_home_frequency, personality_intro_extro, personality_conflict_style, personality_conflict_address_method, personality_sharing_preferences, personality_smoking, personality_cooking_frequency, personality_expense_handling, personality_pet_ownership, personality_pet_comfort')
          .eq('user_id', userId)
          .single();
        
        if (data) {
          const prefilled: Partial<PersonalityAnswers> = {};
          Object.entries(data).forEach(([key, value]) => {
            if (value != null && value !== '') {
              (prefilled as any)[key] = value;
            }
          });
          if (!prefilled.personality_shared_space_cleanliness_importance) {
            prefilled.personality_shared_space_cleanliness_importance = 3;
          }
          setAnswers(prefilled);
        }
      };
      loadExistingAnswers();
    }
    if (!open) {
      setCurrentStep(0);
    }
  }, [open, openedFrom, userId]);

  const questions = [
    // Step 1: Lifestyle & Daily Rhythm
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
          id: "personality_partner_overnight",
          question: "How often does your significant other / partner stay overnight?",
          type: "radio",
          options: [
            { value: "never", label: "Never / I'm not in a relationship" },
            { value: "occasionally", label: "Occasionally (once a month or less)" },
            { value: "few_nights", label: "A few nights a week" },
            { value: "very_often", label: "Very often (essentially lives here)" }
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
    // Step 2: Work & Daily Routine
    {
      section: "Work & Daily Routine",
      questions: [
        {
          id: "personality_study_time",
          question: "When do you typically work or spend most of your active day?",
          type: "radio",
          options: [
            { value: "morning", label: "Morning (before noon)" },
            { value: "afternoon", label: "Afternoon (noon to 6 PM)" },
            { value: "evening", label: "Evening (6 PM to midnight)" },
            { value: "late_night", label: "Late night (after midnight)" }
          ]
        },
        {
          id: "personality_home_frequency",
          question: "How often are you home during the day on weekdays?",
          type: "radio",
          options: [
            { value: "rarely", label: "Rarely — I'm mostly out" },
            { value: "few_days", label: "A few days a week" },
            { value: "most_days", label: "Most days" },
            { value: "almost_always", label: "Almost always home (remote work / work from home)" }
          ]
        }
      ]
    },
    // Step 3: Social & Compatibility
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
          id: "personality_conflict_address_method",
          question: "When there's an issue with a roommate, how do you prefer to address it?",
          type: "radio",
          options: [
            { value: "in_person", label: "In person, right away" },
            { value: "text_first", label: "Via text or message first" },
            { value: "wait_calm", label: "Wait for a calm, good moment" },
            { value: "let_go", label: "I prefer to let small things go" }
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
    // Step 4: Habits & Preferences
    {
      section: "Habits & Preferences",
      questions: [
        {
          id: "personality_smoking",
          question: "Do you smoke?",
          type: "radio",
          options: [
            { value: "no", label: "No" },
            { value: "outside_only", label: "Yes, but only outside" },
            { value: "yes_indoors", label: "Yes, including indoors" }
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
        },
        {
          id: "personality_expense_handling",
          question: "How do you prefer to handle shared household expenses?",
          type: "radio",
          options: [
            { value: "split_track", label: "Split equally and track carefully" },
            { value: "split_trust", label: "Split equally and trust it evens out" },
            { value: "pay_own", label: "Pay for what I personally use" },
            { value: "flexible", label: "Flexible — discuss case by case" }
          ]
        }
      ]
    },
    // Step 5: Pets & Dealbreakers
    {
      section: "Pets & Dealbreakers",
      questions: [
        {
          id: "personality_pet_ownership",
          question: "Do you have or plan to get a pet?",
          type: "radio",
          options: [
            { value: "no", label: "No, and I don't plan to" },
            { value: "open", label: "No, but I'm open to it in the future" },
            { value: "yes", label: "Yes, I have a pet" }
          ]
        },
        {
          id: "personality_pet_comfort",
          question: "Are you comfortable living with someone who has a pet?",
          type: "radio",
          options: [
            { value: "love_animals", label: "Yes, I love animals" },
            { value: "if_clean", label: "Yes, as long as it's kept clean" },
            { value: "depends", label: "Depends on the type of pet" },
            { value: "no_pets", label: "No, I prefer a pet-free home" },
            { value: "allergies", label: "I have allergies — pet-free is required" }
          ]
        }
      ]
    }
  ];

  const currentSection = questions[currentStep];
  const totalSteps = questions.length;
  const progress = (currentStep / totalSteps) * 100;

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

    const partnerMap = { never: 0, occasionally: 0.33, few_nights: 0.66, very_often: 1 };
    vector.partner_overnight = partnerMap[answers.personality_partner_overnight as keyof typeof partnerMap] ?? 0;
    
    const cleanMap = { very_clean: 1, clean: 0.75, average: 0.5, messy: 0.25 };
    vector.cleanliness_level = cleanMap[answers.personality_cleanliness_level as keyof typeof cleanMap] ?? 0.5;
    
    vector.shared_space_importance = ((answers.personality_shared_space_cleanliness_importance || 3) - 1) / 4;
    
    const socialMap = { introvert: 0, ambivert: 0.5, extrovert: 1 };
    vector.social_energy = socialMap[answers.personality_intro_extro as keyof typeof socialMap] ?? 0.5;
    
    const smokingMap = { no: 0, outside_only: 0.5, yes_indoors: 1 };
    vector.smoking = smokingMap[answers.personality_smoking as keyof typeof smokingMap] ?? 0;

    const homeMap = { rarely: 0, few_days: 0.33, most_days: 0.66, almost_always: 1 };
    vector.home_frequency = homeMap[answers.personality_home_frequency as keyof typeof homeMap] ?? 0.5;

    const petOwnershipMap = { no: 0, open: 0.5, yes: 1 };
    vector.pet_ownership = petOwnershipMap[answers.personality_pet_ownership as keyof typeof petOwnershipMap] ?? 0;

    const petComfortMap = { love_animals: 1, if_clean: 0.75, depends: 0.5, no_pets: 0.25, allergies: 0 };
    vector.pet_comfort = petComfortMap[answers.personality_pet_comfort as keyof typeof petComfortMap] ?? 0.5;
    
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

  const handleSaveAndClose = async () => {
    setSaving(true);
    try {
      const { data: studentData, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (fetchError || !studentData) throw new Error('Student profile not found');

      // Save only the current step's answers
      const currentQuestionIds = currentSection.questions.map(q => q.id);
      const stepAnswers: Record<string, any> = {};
      currentQuestionIds.forEach(id => {
        if (answers[id as keyof PersonalityAnswers] !== undefined) {
          stepAnswers[id] = answers[id as keyof PersonalityAnswers];
        }
      });

      const { error: updateError } = await supabase
        .from('students')
        .update(stepAnswers)
        .eq('id', studentData.id);

      if (updateError) throw updateError;

      toast({ title: "Saved", description: "Your answers have been saved" });
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving personality survey:', error);
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
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
