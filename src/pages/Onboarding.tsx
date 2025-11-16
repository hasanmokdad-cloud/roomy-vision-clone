import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");

  const questions = [
    "Welcome to Roomy! What’s your full name?",
    "Which university are you currently attending?",
    "What’s your monthly budget (in USD)?",
    "Do you prefer a Private Room, Shared Room, or Studio?",
    "Would you describe yourself as more Social or Quiet?",
    "What amenities matter most to you (AC, gym, parking, Wi-Fi...)?",
    "Which area or campus would you prefer to live near?"
  ];

  const handleNext = async () => {
    if (!input.trim()) return;

    const updated = { ...answers, [questions[step]]: input };
    setAnswers(updated);
    setInput("");

    if (step === questions.length - 1) {
      // ✅ Save all answers to Supabase
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from("user_preferences").upsert({
          user_id: user.id,
          preferences: updated
        });

        if (error) {
          console.error("❌ Error saving preferences:", error);
          alert("Failed to save preferences. Please try again.");
          return;
        }

        // Redirect to AI Match page
        navigate("/ai-match");
      } else {
        alert("You need to be logged in to save preferences.");
      }
    } else {
      setStep(step + 1);
    }
  };

  const progress = ((step + 1) / questions.length) * 100;

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
          placeholder="Type your answer..."
          className="w-full text-center text-lg bg-white/20 border border-white/30 text-white placeholder:text-white/60 rounded-xl py-3"
        />

        <Progress value={progress} className="my-6" />

        <Button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-emerald-400 to-blue-500 text-white text-lg py-3 rounded-xl shadow-lg hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] transition-all"
        >
          {step === questions.length - 1 ? "Finish 🎯" : "Next →"}
        </Button>
      </motion.div>
    </div>
  );
}
