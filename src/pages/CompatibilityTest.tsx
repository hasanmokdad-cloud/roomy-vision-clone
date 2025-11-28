import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { 
  compatibilityQuestions, 
  questionsByCategory,
  categoryLabels,
  categoryDescriptions 
} from "@/data/compatibilityQuestions";

type CategoryKey = 'lifestyle' | 'study_work' | 'personality' | 'similarity' | 'advanced';

export default function CompatibilityTest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentCategory, setCurrentCategory] = useState<CategoryKey>('lifestyle');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadExistingResponses();
  }, []);

  const loadExistingResponses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUserId(user.id);

    // Load existing responses
    const { data, error } = await supabase
      .from('personality_responses')
      .select('question_id, response')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading responses:', error);
      return;
    }

    if (data) {
      const existingAnswers: Record<number, number> = {};
      data.forEach(r => {
        existingAnswers[r.question_id] = r.response;
      });
      setAnswers(existingAnswers);

      // Check if user has advanced enabled
      const { data: student } = await supabase
        .from('students')
        .select('advanced_compatibility_enabled')
        .eq('user_id', user.id)
        .single();

      if (student?.advanced_compatibility_enabled) {
        setShowAdvanced(true);
      }
    }
  };

  const categories: CategoryKey[] = ['lifestyle', 'study_work', 'personality', 'similarity'];
  const currentCategoryIndex = categories.indexOf(currentCategory);
  const currentQuestions = questionsByCategory[currentCategory];
  const advancedQuestions = questionsByCategory.advanced;

  const allRequiredQuestions = compatibilityQuestions.filter(q => !q.isAdvanced);
  const answeredRequired = allRequiredQuestions.filter(q => answers[q.id] !== undefined).length;
  const answeredAdvanced = showAdvanced 
    ? advancedQuestions.filter(q => answers[q.id] !== undefined).length 
    : 0;

  const totalRequired = allRequiredQuestions.length;
  const totalAdvanced = advancedQuestions.length;
  const progressPercent = showAdvanced
    ? Math.round(((answeredRequired + answeredAdvanced) / (totalRequired + totalAdvanced)) * 100)
    : Math.round((answeredRequired / totalRequired) * 100);

  const isCategoryComplete = currentQuestions.every(q => answers[q.id] !== undefined);

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategory(categories[currentCategoryIndex + 1]);
    } else if (!showAdvanced) {
      // Reached end of basic questions, show advanced toggle
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategory(categories[currentCategoryIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Save all responses
      const responsesToSave = Object.entries(answers).map(([questionId, response]) => ({
        user_id: userId,
        question_id: parseInt(questionId),
        response
      }));

      // Upsert responses
      const { error: responseError } = await supabase
        .from('personality_responses')
        .upsert(responsesToSave, { onConflict: 'user_id,question_id' });

      if (responseError) throw responseError;

      // Update student record
      const { error: studentError } = await supabase
        .from('students')
        .update({
          compatibility_test_completed: true,
          advanced_compatibility_enabled: showAdvanced,
          enable_personality_matching: true
        })
        .eq('user_id', userId);

      if (studentError) throw studentError;

      toast({
        title: "Compatibility Test Completed! 🎉",
        description: "Your responses will be used to find the best roommate matches for you.",
      });

      navigate('/profile');
    } catch (error: any) {
      console.error('Error saving responses:', error);
      toast({
        title: "Error",
        description: "Failed to save your responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = answeredRequired === totalRequired && (!showAdvanced || answeredAdvanced === totalAdvanced);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-500/5 to-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">
                Compatibility Test
              </h1>
              <p className="text-muted-foreground">
                Find your perfect roommate match
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-semibold text-purple-600">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{answeredRequired}/{totalRequired} required</span>
              {showAdvanced && (
                <span className="text-purple-600">
                  + {answeredAdvanced}/{totalAdvanced} advanced
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat, idx) => {
            const questions = questionsByCategory[cat];
            const answered = questions.filter(q => answers[q.id] !== undefined).length;
            const isComplete = answered === questions.length;
            const isCurrent = cat === currentCategory;

            return (
              <Button
                key={cat}
                variant={isCurrent ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentCategory(cat)}
                className="flex-shrink-0"
              >
                {isComplete && <CheckCircle2 className="w-3 h-3 mr-1" />}
                Section {String.fromCharCode(65 + idx)}
              </Button>
            );
          })}
          {showAdvanced && (
            <Button
              variant={currentCategory === 'advanced' ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentCategory('advanced')}
              className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Advanced
            </Button>
          )}
        </div>

        {/* Current Category Questions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 mb-6 border-2 border-purple-500/20">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {categoryLabels[currentCategory]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {categoryDescriptions[currentCategory]}
                </p>
              </div>

              <div className="space-y-6">
                {currentQuestions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">
                        {question.id}
                      </Badge>
                      <p className="text-foreground font-medium flex-1">
                        {question.text}
                      </p>
                    </div>

                    {/* Likert Scale */}
                    <div className="flex items-center justify-between gap-2 pl-11">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => handleAnswer(question.id, value)}
                          className={`flex-1 py-3 px-2 rounded-lg border-2 transition-all ${
                            answers[question.id] === value
                              ? 'border-purple-500 bg-purple-500 text-white shadow-lg scale-105'
                              : 'border-border hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                          }`}
                        >
                          <div className="text-sm font-semibold">{value}</div>
                          <div className="text-xs opacity-70">
                            {value === 1 && 'Strongly Disagree'}
                            {value === 2 && 'Disagree'}
                            {value === 3 && 'Neutral'}
                            {value === 4 && 'Agree'}
                            {value === 5 && 'Strongly Agree'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentCategoryIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentCategoryIndex < categories.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isCategoryComplete}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : !showAdvanced ? (
                <div className="flex-1" />
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Advanced Compatibility Toggle */}
        {currentCategory === 'similarity' && !showAdvanced && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="p-6 border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <div className="flex items-start gap-4">
                <Sparkles className="w-8 h-8 text-purple-500 flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Enable Advanced Compatibility Questions?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Get even more accurate matches with 10 additional lifestyle questions covering smoking, drinking, temperature preferences, pets, and more.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={showAdvanced}
                      onCheckedChange={setShowAdvanced}
                      id="advanced-toggle"
                    />
                    <Label htmlFor="advanced-toggle" className="cursor-pointer">
                      {showAdvanced ? 'Advanced questions enabled' : 'Enable advanced questions'}
                    </Label>
                  </div>

                  {showAdvanced && (
                    <Button
                      onClick={() => setCurrentCategory('advanced')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Continue to Advanced Questions
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Submit Button */}
        {(currentCategory === 'similarity' && !showAdvanced) || 
         (currentCategory === 'advanced' && showAdvanced) ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full py-6 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Complete Compatibility Test
                </>
              )}
            </Button>
            {!canSubmit && (
              <p className="text-sm text-center text-muted-foreground mt-2">
                Please answer all questions to continue
              </p>
            )}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
