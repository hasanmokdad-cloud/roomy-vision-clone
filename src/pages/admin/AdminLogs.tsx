import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    const channel = supabase.channel('system-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, () => loadLogs()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadLogs = async () => {
    const { data } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(100);
    if (data) setLogs(data);
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button>
        <div><h1 className="text-3xl font-bold gradient-text">System Logs</h1><p className="text-foreground/60 mt-2">Audit trail of all admin and owner actions</p></div>
        <div className="glass-hover rounded-2xl overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Action</TableHead><TableHead>Table</TableHead><TableHead>User ID</TableHead><TableHead>Record ID</TableHead></TableRow></TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.log_id}><TableCell>{format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}</TableCell><TableCell><Badge>{log.action}</Badge></TableCell><TableCell>{log.table_affected}</TableCell><TableCell className="font-mono text-xs">{log.user_id?.slice(0, 8)}...</TableCell><TableCell className="font-mono text-xs">{log.record_id?.slice(0, 8)}...</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}