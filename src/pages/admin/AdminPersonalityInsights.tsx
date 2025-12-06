import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, Search, Users, TrendingUp, BarChart3, ArrowLeft } from "lucide-react";
import { categoryLabels } from "@/data/compatibilityQuestions";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminPersonalityInsights() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadInsights(); }, []);

  const loadInsights = async () => {
    setLoading(true);
    const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { data: completedStudents } = await supabase.from('students').select('user_id, full_name, email, compatibility_test_completed, advanced_compatibility_enabled, updated_at').eq('compatibility_test_completed', true);
    const totalCompletions = completedStudents?.length || 0;
    const completionRate = totalStudents ? (totalCompletions / totalStudents) * 100 : 0;
    const advancedEnabled = completedStudents?.filter(s => s.advanced_compatibility_enabled).length || 0;
    setStats({ totalCompletions, completionRate, advancedEnabled });
    setStudents(completedStudents?.map(s => ({ userId: s.user_id, fullName: s.full_name, email: s.email, completedAt: s.updated_at, hasAdvanced: s.advanced_compatibility_enabled })) || []);
    setLoading(false);
  };

  const filteredStudents = students.filter(s => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <AdminLayout><div className="flex items-center justify-center min-h-screen"><Brain className="w-12 h-12 text-purple-500 animate-pulse" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button>
        <div className="flex items-center gap-3"><div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl"><Brain className="w-8 h-8 text-white" /></div><div><h1 className="text-3xl font-black text-foreground">Personality Insights</h1><p className="text-muted-foreground">Aggregate statistics and completion data</p></div></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-2 border-purple-500/20"><div className="flex items-center gap-3 mb-3"><Users className="w-6 h-6 text-purple-500" /><h3 className="font-bold text-foreground">Total Completions</h3></div><div className="text-4xl font-black text-purple-600">{stats?.totalCompletions || 0}</div><p className="text-sm text-muted-foreground mt-2">{stats?.completionRate.toFixed(1)}% of all students</p></Card>
          <Card className="p-6 border-2 border-blue-500/20"><div className="flex items-center gap-3 mb-3"><TrendingUp className="w-6 h-6 text-blue-500" /><h3 className="font-bold text-foreground">Advanced Enabled</h3></div><div className="text-4xl font-black text-blue-600">{stats?.advancedEnabled || 0}</div></Card>
          <Card className="p-6 border-2 border-green-500/20"><div className="flex items-center gap-3 mb-3"><BarChart3 className="w-6 h-6 text-green-500" /><h3 className="font-bold text-foreground">Completion Rate</h3></div><div className="text-4xl font-black text-green-600">{stats?.completionRate.toFixed(1)}%</div></Card>
        </div>
        <Card className="p-6"><div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-foreground">Students Who Completed Test</h2><div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div></div>
          <Table><TableHeader><TableRow><TableHead>Student Name</TableHead><TableHead>Email</TableHead><TableHead>Advanced</TableHead><TableHead>Completed</TableHead></TableRow></TableHeader><TableBody>{filteredStudents.map((student) => (<TableRow key={student.userId}><TableCell className="font-medium">{student.fullName}</TableCell><TableCell className="text-muted-foreground">{student.email}</TableCell><TableCell>{student.hasAdvanced ? <Badge className="bg-purple-100 text-purple-700">✓ Advanced</Badge> : <span className="text-muted-foreground text-sm">Basic</span>}</TableCell><TableCell className="text-sm text-muted-foreground">{new Date(student.completedAt).toLocaleDateString()}</TableCell></TableRow>))}</TableBody></Table>
        </Card>
      </div>
    </AdminLayout>
  );
}