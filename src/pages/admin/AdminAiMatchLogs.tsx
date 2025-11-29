import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Clock } from 'lucide-react';

export default function AdminAiMatchLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from('ai_match_logs')
      .select(`
        *,
        students (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p>Loading AI Match logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Match Logs</h1>
          <p className="text-foreground/60 mt-1">
            Monitor AI-powered matching requests and performance
          </p>
        </div>
      </div>

      <Card className="glass-hover">
        <CardHeader>
          <CardTitle>Recent Match Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Personality</TableHead>
                <TableHead>Results</TableHead>
                <TableHead>Time (ms)</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {log.students?.full_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.students?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {log.mode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        log.match_tier === 'vip' ? 'default' : 
                        log.match_tier === 'advanced' ? 'secondary' : 
                        'outline'
                      }
                      className="capitalize"
                    >
                      {log.match_tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.personality_used ? (
                      <Badge variant="default" className="bg-purple-500">
                        ✓ Used
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{log.result_count}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {log.processing_time_ms || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No AI Match logs yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
