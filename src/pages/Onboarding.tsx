import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAnalyticsEvent, triggerRecommenderTraining } from "@/utils/analytics";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // First refresh session to get latest email verification status
      console.log("🔄 Onboarding: Refreshing session...");
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("❌ Onboarding: Session refresh failed:", refreshError);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const sessionToUse = refreshedSession?.session || sessionData?.session;
      
      if (!sessionToUse) {
        navigate("/auth", { replace: true });
        return;
      }

      console.log("📧 Onboarding: Email confirmed at:", sessionToUse.user.email_confirmed_at);

      // Check email verification
      if (!sessionToUse.user.email_confirmed_at) {
        toast({
          title: "Email verification required",
          description: "Please verify your email before continuing with onboarding.",
          variant: "destructive",
        });
        navigate("/select-role", { replace: true });
        return;
      }

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", sessionToUse.user.id)
        .maybeSingle();

      const roleName = roleRow?.roles?.name as string | null;
      setRole(roleName);

      if (roleName === "owner" || roleName === "admin") {
        navigate("/owner", { replace: true });
      }
    }

    init();
  }, [navigate, toast]);

  const questions = [
    "Welcome to Roomy! What's your full name?",
    "Which university are you currently attending?",
    "What's your monthly budget (in USD)?",
    "Do you prefer a Private Room, Shared Room, or Studio?",
    "Would you describe yourself as more Social or Quiet?",
    "What amenities matter most to you (AC, gym, parking, Wi-Fi...)?",
    "Which area or campus would you prefer to live near?"
  ];

  const handleNext = async () => {
    if (!input.trim()) {
      toast({
        title: "Please provide an answer",
        description: "We need this information to personalize your experience.",
        variant: "destructive"
      });
      return;
    }

    const updated = { ...answers, [questions[step]]: input };
    setAnswers(updated);
    setInput("");

    if (step === questions.length - 1) {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from("user_preferences").upsert({
          user_id: user.id,
          preferences: updated,
        });

        if (error) {
          console.error("❌ Error saving preferences:", error);
          toast({
            title: "Error",
            description: "Failed to save preferences. Please try again.",
            variant: "destructive"
          });
          setSaving(false);
          return;
        }

        // Log onboarding completion and trigger recommender training
        await logAnalyticsEvent({
          eventType: 'onboarding_complete',
          userId: user.id,
          metadata: { preferences: updated }
        });
        
        await triggerRecommenderTraining(user.id);

        toast({
          title: "Preferences Saved! 🎉",
          description: "Redirecting you to your personalized AI chat..."
        });

        // Redirect to AI Chat once preferences are saved
        setTimeout(() => {
          navigate("/ai-chat", { replace: true });
        }, 1500);
      } else {
        toast({
          title: "Authentication Required",
          description: "You need to be logged in to save preferences.",
          variant: "destructive"
        });
        navigate("/auth");
      }

      setSaving(false);
    } else {
      setStep(step + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNext();
    }
  };

  const progress = ((step + 1) / questions.length) * 100;

  if (role === "owner" || role === "admin") return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-blue-600 to-emerald-400 text-white px-6 py-10">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 md:p-10 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-emerald-300" />
          <h2 className="text-2xl font-bold gradient-text">
            Question {step + 1} of {questions.length}
          </h2>
        </div>

        <p className="text-lg md:text-xl mb-6 font-medium leading-snug text-white/90">
          {questions[step]}
        </p>

        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your answer..."
          className="w-full text-center text-lg bg-white/20 border border-white/30 text-white placeholder:text-white/60 rounded-xl py-3"
        />

        <Progress value={progress} className="my-6" />

        <Button
          onClick={handleNext}
          disabled={saving}
          className="w-full bg-gradient-to-r from-emerald-400 to-blue-500 text-white text-lg py-3 rounded-xl shadow-lg hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] transition-all disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : step === questions.length - 1
            ? "Finish 🎯"
            : "Next →"}
        </Button>
      </motion.div>
    </div>
  );
}
