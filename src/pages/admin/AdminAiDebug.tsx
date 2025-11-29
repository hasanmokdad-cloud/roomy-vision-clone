import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, ChevronDown, ChevronRight, Users, Home, TrendingUp } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardHeader } from "@/components/admin/DashboardHeader";

export default function AdminAiDebug() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', user.id);

      const isAdmin = roles?.some(r => r.roles?.name === 'admin');
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive"
        });
        navigate('/');
      }
    };

    checkAdminAccess();
  }, [navigate, toast]);

  // Load students list
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, user_id, full_name, email, university, ai_match_plan')
      .order('full_name');

    if (error) {
      console.error('Error loading students:', error);
      return;
    }

    setStudents(data || []);
  };

  // Load logs for selected student
  useEffect(() => {
    if (selectedStudent) {
      loadLogs();
    }
  }, [selectedStudent]);

  const loadLogs = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('ai_match_logs')
      .select('*')
      .eq('student_id', selectedStudent)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading logs:', error);
      toast({
        title: "Error",
        description: "Failed to load AI match logs",
        variant: "destructive"
      });
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  const simulateMatch = async () => {
    if (!selectedStudent) return;

    const student = students.find(s => s.id === selectedStudent);
    if (!student) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('roomy-ai-core', {
        body: {
          mode: 'roommate',
          match_tier: student.ai_match_plan || 'basic',
          personality_enabled: true,
          limit: 10
        }
      });

      if (error) throw error;

      toast({
        title: "Match Simulation Complete",
        description: `Found ${data.matches?.length || 0} matches`,
      });

      // Reload logs
      loadLogs();
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: "Simulation Failed",
        description: "Failed to simulate match",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <DashboardHeader />
        
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-500" />
                <div>
                  <CardTitle>AI Match Debug Console</CardTitle>
                  <CardDescription>
                    View detailed AI match scores, sub-scores, and insights for debugging
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Student Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Select Student</label>
                  <Select value={selectedStudent || ''} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={simulateMatch} 
                  disabled={!selectedStudent || loading}
                >
                  Simulate Match
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          {selectedStudent && (
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Match Logs</CardTitle>
                <CardDescription>
                  {logs.length} log entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading logs...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No logs found. Try simulating a match.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map(log => (
                      <Collapsible key={log.id}>
                        <Card className="overflow-hidden">
                          <CollapsibleTrigger
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            className="w-full"
                          >
                            <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-4">
                                {expandedLog === log.id ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                
                                <div className="flex items-center gap-2">
                                  {log.mode === 'dorm' && <Home className="w-4 h-4" />}
                                  {log.mode === 'roommate' && <Users className="w-4 h-4" />}
                                  <Badge variant="outline">{log.mode}</Badge>
                                </div>

                                <Badge 
                                  className={
                                    log.match_tier === 'vip' ? 'bg-amber-500' :
                                    log.match_tier === 'advanced' ? 'bg-blue-500' :
                                    'bg-muted'
                                  }
                                >
                                  {log.match_tier}
                                </Badge>

                                <span className="text-sm text-muted-foreground">
                                  {log.result_count} matches
                                </span>

                                {log.personality_used && (
                                  <Badge variant="secondary">
                                    <Brain className="w-3 h-3 mr-1" />
                                    Personality
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{log.processing_time_ms}ms</span>
                                <span>
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <Separator />
                            <div className="p-4 space-y-4 bg-muted/20">
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Match Details</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Mode:</span> {log.mode}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Tier:</span> {log.match_tier}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Results:</span> {log.result_count}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Personality Used:</span> {log.personality_used ? 'Yes' : 'No'}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Insights Generated:</span> {log.insights_generated ? 'Yes' : 'No'}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Processing Time:</span> {log.processing_time_ms}ms
                                  </div>
                                </div>
                              </div>

                              <div className="text-xs text-muted-foreground italic">
                                Note: Sub-scores for individual matches are shown in the AI Match page when matches are loaded.
                                Future enhancement: Store match details in logs for full debugging.
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
