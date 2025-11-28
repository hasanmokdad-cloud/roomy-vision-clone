import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Brain, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { personalityQuestions } from '@/data/personalityQuestions';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

const PersonalityTest = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const currentQuestion = personalityQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / personalityQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === personalityQuestions.length - 1;
  const canProceed = answers[currentQuestion.id] !== undefined;

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: parseInt(value) });
  };

  const handleNext = () => {
    if (canProceed && !isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const computePersonalityVector = (answerData: Record<string, number>) => {
    const traits: Record<string, number> = { 
      openness: 0, 
      conscientiousness: 0, 
      extraversion: 0, 
      agreeableness: 0, 
      neuroticism: 0 
    };
    const counts: Record<string, number> = { 
      openness: 0, 
      conscientiousness: 0, 
      extraversion: 0, 
      agreeableness: 0, 
      neuroticism: 0 
    };

    personalityQuestions.forEach(q => {
      const score = q.reverse ? (6 - answerData[q.id]) : answerData[q.id];
      traits[q.trait] += score;
      counts[q.trait]++;
    });

    // Normalize to 0-100 scale
    return {
      openness: Math.round((traits.openness / (counts.openness * 5)) * 100),
      conscientiousness: Math.round((traits.conscientiousness / (counts.conscientiousness * 5)) * 100),
      extraversion: Math.round((traits.extraversion / (counts.extraversion * 5)) * 100),
      agreeableness: Math.round((traits.agreeableness / (counts.agreeableness * 5)) * 100),
      neuroticism: Math.round((traits.neuroticism / (counts.neuroticism * 5)) * 100),
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const personalityVector = computePersonalityVector(answers);

      const { error } = await supabase
        .from('students')
        .update({
          personality_data: personalityVector,
          personality_test_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Test Completed! ✨',
        description: 'Your personality profile has been saved for better roommate matching.',
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error saving personality test:', error);
      toast({
        title: 'Error',
        description: 'Failed to save personality test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 md:pt-28">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 mb-8"
        >
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-8 h-8 text-purple-500" />
            <h1 className="text-4xl font-bold gradient-text">Personality Test</h1>
          </div>
          <p className="text-muted-foreground">
            Help us find your perfect roommate match with a quick personality assessment
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestionIndex + 1} of {personalityQuestions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[currentQuestion.id]?.toString()}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {[
                    { value: '1', label: 'Strongly Disagree' },
                    { value: '2', label: 'Disagree' },
                    { value: '3', label: 'Neutral' },
                    { value: '4', label: 'Agree' },
                    { value: '5', label: 'Strongly Agree' }
                  ].map(option => (
                    <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={option.value} id={`q${currentQuestion.id}-${option.value}`} />
                      <Label 
                        htmlFor={`q${currentQuestion.id}-${option.value}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-6">
          <Button
            onClick={handleBack}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {!isLastQuestion ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : (
                <>
                  Complete Test
                  <Check className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PersonalityTest;
