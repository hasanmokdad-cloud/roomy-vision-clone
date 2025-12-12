import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface BoostQuestion {
  id: string;
  text: string;
  type: "scale" | "choice";
  options?: string[];
  scaleLabels?: [string, string];
}

const boostQuestions: BoostQuestion[] = [
  {
    id: "wake_time",
    text: "Are you a morning person or a night owl?",
    type: "choice",
    options: ["Early bird (wake before 7am)", "Normal schedule (7-9am)", "Late riser (after 9am)", "Night owl (sleep after midnight)"],
  },
  {
    id: "cleanliness",
    text: "How would you rate your cleanliness level?",
    type: "scale",
    scaleLabels: ["Relaxed about mess", "Very organized and clean"],
  },
  {
    id: "noise_tolerance",
    text: "How much noise can you tolerate?",
    type: "scale",
    scaleLabels: ["Need complete silence", "Don't mind noise"],
  },
  {
    id: "guest_policy",
    text: "How often do you have guests over?",
    type: "choice",
    options: ["Rarely or never", "Once a month", "Few times a month", "Weekly or more"],
  },
  {
    id: "cooking_habits",
    text: "How often do you cook at home?",
    type: "choice",
    options: ["Rarely (eat out/order)", "2-3 times a week", "Most days", "Every day"],
  },
  {
    id: "exercise_routine",
    text: "How important is fitness/exercise to you?",
    type: "scale",
    scaleLabels: ["Not important", "Very important"],
  },
  {
    id: "study_schedule",
    text: "When do you prefer to study?",
    type: "choice",
    options: ["Morning (6am-12pm)", "Afternoon (12pm-6pm)", "Evening (6pm-10pm)", "Late night (after 10pm)"],
  },
  {
    id: "sharing_comfort",
    text: "How comfortable are you sharing items (snacks, supplies, etc.)?",
    type: "scale",
    scaleLabels: ["Prefer to keep separate", "Happy to share"],
  },
  {
    id: "conflict_style",
    text: "How do you prefer to handle conflicts?",
    type: "choice",
    options: ["Address immediately", "Think it over first", "Avoid confrontation", "Seek mediation/third party"],
  },
  {
    id: "social_energy",
    text: "Rate your social energy level",
    type: "scale",
    scaleLabels: ["Introvert (need alone time)", "Extrovert (energized by people)"],
  },
  {
    id: "organization_style",
    text: "Are you more organized or spontaneous?",
    type: "scale",
    scaleLabels: ["Very spontaneous", "Very organized"],
  },
  {
    id: "temperature_preference",
    text: "What's your temperature preference?",
    type: "choice",
    options: ["Like it cold (AC always on)", "Moderate (AC as needed)", "Like it warm (minimal AC)", "Prefer natural ventilation"],
  },
];

export default function BoostProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { loading: authLoading, userId } = useAuthGuard();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [existingPreferences, setExistingPreferences] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [hasBoostData, setHasBoostData] = useState(false);

  const progress = ((currentStep + 1) / boostQuestions.length) * 100;
  const isLastQuestion = currentStep === boostQuestions.length - 1;
  const currentQuestion = boostQuestions[currentStep];

  useEffect(() => {
    if (userId) {
      loadExistingData();
    }
  }, [userId]);

  const loadExistingData = async () => {
    const { data } = await supabase
      .from("user_preferences")
      .select("preferences")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.preferences) {
      const prefs = data.preferences as any;
      setExistingPreferences(prefs);
      
      // Check if boost data exists
      const boostData = prefs?.boost_profile || {};
      if (Object.keys(boostData).length > 0) {
        setHasBoostData(true);
        setAnswers(boostData);
      }
    }
  };

  const handleAnswer = (value: any) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      toast({
        title: "Please answer the question",
        description: "Select an option to continue",
        variant: "destructive",
      });
      return;
    }

    if (isLastQuestion) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Merge boost answers with existing preferences
      const updatedPreferences = {
        ...(existingPreferences || {}),
        boost_profile: answers,
        boost_completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Profile Boosted! 🚀",
        description: "Your matching accuracy has been improved. Check out your new matches!",
      });

      // Navigate to roommate match page
      navigate("/ai-roommate-match");
    } catch (error) {
      console.error("Error saving boost profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your answers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      {!isMobile && <RoomyNavbar />}

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-purple-700 via-blue-600 to-emerald-400 bg-clip-text text-transparent">
                  Boost Your Profile
                </span>
              </h1>
            </div>
            <p className="text-foreground/70 text-lg mb-4">
              {hasBoostData 
                ? "Update your answers to refine your matches even more"
                : "Answer these questions to improve your roommate matching accuracy"}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-foreground/60">
              <span>Question {currentStep + 1} of {boostQuestions.length}</span>
              <Progress value={progress} className="w-32" />
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Question Card */}
          <Card className="mb-6 shadow-lg border-muted/40 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {currentQuestion.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion.type === "choice" && currentQuestion.options && (
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant={answers[currentQuestion.id] === option ? "default" : "outline"}
                      className={`h-auto py-4 text-left justify-start ${
                        answers[currentQuestion.id] === option
                          ? "bg-gradient-to-r from-primary to-secondary text-white"
                          : ""
                      }`}
                      onClick={() => handleAnswer(option)}
                    >
                      {answers[currentQuestion.id] === option && (
                        <Check className="w-5 h-5 mr-2 flex-shrink-0" />
                      )}
                      <span>{option}</span>
                    </Button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "scale" && currentQuestion.scaleLabels && (
                <div className="space-y-4">
                  <div className="pt-4">
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[answers[currentQuestion.id] || 5]}
                      onValueChange={(value) => handleAnswer(value[0])}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-foreground/60">
                    <span>{currentQuestion.scaleLabels[0]}</span>
                    <span className="text-primary font-semibold text-lg">
                      {answers[currentQuestion.id] || 5}/10
                    </span>
                    <span>{currentQuestion.scaleLabels[1]}</span>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id] || saving}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white"
                >
                  {saving ? (
                    "Saving..."
                  ) : isLastQuestion ? (
                    <>
                      Complete <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Skip Option */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/ai-roommate-match")}
              className="text-foreground/60 hover:text-foreground"
            >
              Skip for now
            </Button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
