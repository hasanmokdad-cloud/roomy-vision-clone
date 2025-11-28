import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Brain, Search, Users, TrendingUp, BarChart3 } from "lucide-react";
import { categoryLabels } from "@/data/compatibilityQuestions";

interface AggregateStats {
  totalCompletions: number;
  completionRate: number;
  advancedEnabled: number;
  averageScoresByCategory: {
    lifestyle: number;
    study_work: number;
    personality: number;
    similarity: number;
    advanced: number;
  };
}

interface StudentResponse {
  userId: string;
  fullName: string;
  email: string;
  completedAt: string;
  hasAdvanced: boolean;
  responseCount: number;
}

export default function AdminPersonalityInsights() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // Get total students
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Get students who completed test
      const { data: completedStudents, error: studentsError } = await supabase
        .from('students')
        .select('user_id, full_name, email, compatibility_test_completed, advanced_compatibility_enabled, updated_at')
        .eq('compatibility_test_completed', true);

      if (studentsError) throw studentsError;

      const totalCompletions = completedStudents?.length || 0;
      const completionRate = totalStudents ? (totalCompletions / totalStudents) * 100 : 0;
      const advancedEnabled = completedStudents?.filter(s => s.advanced_compatibility_enabled).length || 0;

      // Get all responses for aggregate statistics
      const { data: allResponses, error: responsesError } = await supabase
        .from('personality_responses')
        .select(`
          user_id,
          question_id,
          response,
          personality_questions (category, is_advanced)
        `);

      if (responsesError) throw responsesError;

      // Calculate average scores by category
      const categoryTotals = {
        lifestyle: { sum: 0, count: 0 },
        study_work: { sum: 0, count: 0 },
        personality: { sum: 0, count: 0 },
        similarity: { sum: 0, count: 0 },
        advanced: { sum: 0, count: 0 }
      };

      allResponses?.forEach((r: any) => {
        const category = r.personality_questions?.category;
        if (category && categoryTotals[category as keyof typeof categoryTotals]) {
          categoryTotals[category as keyof typeof categoryTotals].sum += r.response;
          categoryTotals[category as keyof typeof categoryTotals].count += 1;
        }
      });

      const averageScoresByCategory = {
        lifestyle: categoryTotals.lifestyle.count > 0 
          ? Math.round((categoryTotals.lifestyle.sum / categoryTotals.lifestyle.count) * 20) 
          : 0,
        study_work: categoryTotals.study_work.count > 0 
          ? Math.round((categoryTotals.study_work.sum / categoryTotals.study_work.count) * 20) 
          : 0,
        personality: categoryTotals.personality.count > 0 
          ? Math.round((categoryTotals.personality.sum / categoryTotals.personality.count) * 20) 
          : 0,
        similarity: categoryTotals.similarity.count > 0 
          ? Math.round((categoryTotals.similarity.sum / categoryTotals.similarity.count) * 20) 
          : 0,
        advanced: categoryTotals.advanced.count > 0 
          ? Math.round((categoryTotals.advanced.sum / categoryTotals.advanced.count) * 20) 
          : 0,
      };

      setStats({
        totalCompletions,
        completionRate,
        advancedEnabled,
        averageScoresByCategory
      });

      // Format student data
      const responseCounts = allResponses?.reduce((acc: Record<string, number>, r: any) => {
        acc[r.user_id] = (acc[r.user_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const studentData: StudentResponse[] = completedStudents?.map(s => ({
        userId: s.user_id,
        fullName: s.full_name,
        email: s.email,
        completedAt: s.updated_at,
        hasAdvanced: s.advanced_compatibility_enabled,
        responseCount: responseCounts[s.user_id] || 0
      })) || [];

      setStudents(studentData);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 text-purple-500 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading personality insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">
            Personality Insights
          </h1>
          <p className="text-muted-foreground">
            Aggregate statistics and completion data
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-2 border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-purple-500" />
            <h3 className="font-bold text-foreground">Total Completions</h3>
          </div>
          <div className="text-4xl font-black text-purple-600">
            {stats?.totalCompletions || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {stats?.completionRate.toFixed(1)}% of all students
          </p>
        </Card>

        <Card className="p-6 border-2 border-blue-500/20">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <h3 className="font-bold text-foreground">Advanced Enabled</h3>
          </div>
          <div className="text-4xl font-black text-blue-600">
            {stats?.advancedEnabled || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {stats?.totalCompletions 
              ? Math.round((stats.advancedEnabled / stats.totalCompletions) * 100)
              : 0}% opted for advanced questions
          </p>
        </Card>

        <Card className="p-6 border-2 border-green-500/20">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-6 h-6 text-green-500" />
            <h3 className="font-bold text-foreground">Avg Response Rate</h3>
          </div>
          <div className="text-4xl font-black text-green-600">
            {students.length > 0 
              ? Math.round(students.reduce((sum, s) => sum + s.responseCount, 0) / students.length)
              : 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Questions answered per student
          </p>
        </Card>
      </div>

      {/* Average Scores by Category */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Average Engagement by Category
        </h2>
        <div className="space-y-3">
          {Object.entries(stats?.averageScoresByCategory || {}).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <div className="w-48 font-medium text-sm text-foreground">
                {categoryLabels[key as keyof typeof categoryLabels] || key}
              </div>
              <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${value}%` }}
                />
              </div>
              <div className="w-16 text-right font-bold text-purple-600">
                {value}%
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Student List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Students Who Completed Test
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Advanced</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.userId}>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {student.responseCount} questions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.hasAdvanced ? (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                          ✓ Advanced
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Basic</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(student.completedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Privacy Notice */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          🔒 <strong>Privacy Notice:</strong> Individual student responses are protected and not displayed here. 
          Only aggregate statistics and completion data are shown to maintain student privacy.
        </p>
      </Card>
    </div>
  );
}
