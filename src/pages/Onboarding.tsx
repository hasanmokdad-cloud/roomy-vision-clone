import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";

const questions = [
  "Hi! What’s your full name?",
  "Which university are you attending?",
  "What’s your budget range per month (USD)?",
  "Do you prefer a single or shared room?",
  "Are you looking for a quiet or social environment?",
  "Do you need specific amenities (AC, gym, parking, etc.)?",
  "What area or campus would you like to live near?"
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState("");

  const handleNext = async () => {
    const q = questions[step];
    const updated = { ...answers, [q]: input };
    setAnswers(updated);
    setInput("");

    if (step === questions.length - 1) {
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        preferences: updated
      });
      window.location.href = "/ai-match";
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-600 to-blue-500 text-white p-8">
      <motion.div key={step} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl mb-6">{questions[step]}</h2>
        <input
          className="p-3 w-80 text-black rounded-lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
        />
        <button
          className="mt-4 px-5 py-2 bg-white text-purple-600 rounded-full font-semibold"
          onClick={handleNext}
        >
          {step === questions.length - 1 ? "Finish" : "Next"}
        </button>
      </motion.div>
    </div>
  );
}
