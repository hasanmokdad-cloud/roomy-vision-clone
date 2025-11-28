import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CompatibilityScores } from "@/hooks/useCompatibilityMatch";
import { 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Home,
  BookOpen,
  Brain,
  Users
} from "lucide-react";

interface MatchBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scores: CompatibilityScores;
  matchReasons: string[];
  studentName: string;
}

const getScoreColor = (score: number) => {
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 55) return "text-yellow-600";
  return "text-orange-600";
};

const getScoreIcon = (score: number) => {
  if (score >= 70) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  return <AlertCircle className="w-5 h-5 text-yellow-500" />;
};

const getScoreLabel = (score: number) => {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Great Match";
  if (score >= 55) return "Good Match";
  return "Moderate Match";
};

export function MatchBreakdownModal({
  open,
  onOpenChange,
  scores,
  matchReasons,
  studentName
}: MatchBreakdownModalProps) {
  const categories = [
    {
      key: 'lifestyle',
      label: 'Lifestyle Compatibility',
      description: 'Cleanliness, noise, schedule, and social habits',
      score: scores.lifestyleScore,
      icon: Home
    },
    {
      key: 'study',
      label: 'Study & Work Style',
      description: 'Study environment and work habits',
      score: scores.studyScore,
      icon: BookOpen
    },
    {
      key: 'personality',
      label: 'Personality Alignment',
      description: 'Core personality traits and behaviors',
      score: scores.personalityScore,
      icon: Brain
    },
    {
      key: 'similarity',
      label: 'Roommate Preferences',
      description: 'Similarity and social compatibility',
      score: scores.similarityScore,
      icon: Users
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            Compatibility Breakdown
          </DialogTitle>
          <DialogDescription>
            Detailed compatibility analysis with {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Score */}
          <div className="text-center space-y-3 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border-2 border-purple-500/20">
            <div className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {scores.overallScore}%
            </div>
            <div className="text-lg font-bold text-foreground">
              {getScoreLabel(scores.overallScore)}
            </div>
            <Progress value={scores.overallScore} className="h-3" />
          </div>

          {/* Top Match Reasons */}
          {matchReasons.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Top Match Reasons
              </h3>
              <div className="space-y-2">
                {matchReasons.map((reason, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                      {reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              Category Scores
            </h3>
            
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.key}
                  className="space-y-2 p-4 border border-border rounded-lg hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">
                            {category.label}
                          </h4>
                          {getScoreIcon(category.score)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                        {category.score}%
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          category.score >= 70
                            ? "border-green-500 text-green-700"
                            : "border-yellow-500 text-yellow-700"
                        }
                      >
                        {category.score >= 70 ? "Compatible" : "Moderate"}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={category.score} className="h-2" />
                </div>
              );
            })}

            {/* Advanced Score (if available) */}
            {scores.advancedScore !== null && (
              <div className="space-y-2 p-4 border-2 border-purple-300 dark:border-purple-700 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">
                          Advanced Compatibility
                        </h4>
                        {getScoreIcon(scores.advancedScore)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Lifestyle factors, preferences, and sensitivities
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(scores.advancedScore)}`}>
                      {scores.advancedScore}%
                    </div>
                    <Badge
                      variant="outline"
                      className="border-purple-500 text-purple-700"
                    >
                      Advanced
                    </Badge>
                  </div>
                </div>
                <Progress value={scores.advancedScore} className="h-2" />
              </div>
            )}
          </div>

          {/* Interpretation */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 What does this mean?
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {scores.overallScore >= 85 && (
                "You and this student have excellent compatibility! Your lifestyles, habits, and personalities align very well, making you great potential roommates."
              )}
              {scores.overallScore >= 70 && scores.overallScore < 85 && (
                "You have strong compatibility with this student. While there are some differences, your core values and living styles are well-aligned."
              )}
              {scores.overallScore >= 55 && scores.overallScore < 70 && (
                "You have moderate compatibility. There are similarities, but also some differences to discuss. Open communication will be key."
              )}
              {scores.overallScore < 55 && (
                "Your compatibility is moderate. Consider discussing lifestyle differences to see if you can find common ground."
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
