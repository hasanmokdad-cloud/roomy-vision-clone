import { useState } from "react";
import { questions } from "@/data/questions";

export function useAiMatch() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswer = (id: number, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep(step + 1);
    }
  };

  return { step, setStep, currentQuestion, handleAnswer, answers, questions };
}
