import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Activity, AlertCircle, Users, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminSystemMonitor() {
  const navigate = useNavigate();
  const [dbStats, setDbStats] = useState({ tables: 0, records: 0 });
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      const { count: studentsCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: ownersCount } = await supabase.from('owners').select('*', { count: 'exact', head: true });
      const { count: dormsCount } = await supabase.from('dorms').select('*', { count: 'exact', head: true });
      const { count: messagesCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
      const totalRecords = (studentsCount || 0) + (ownersCount || 0) + (dormsCount || 0) + (messagesCount || 0);
      setDbStats({ tables: 4, records: totalRecords });

      const { data: logs } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(20);
      setErrorLogs(logs || []);

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentStudents } = await supabase.from('students').select('user_id').gte('last_login', fiveMinutesAgo);
      const { data: recentOwners } = await supabase.from('owners').select('user_id').gte('last_login', fiveMinutesAgo);
      setActiveSessions((recentStudents?.length || 0) + (recentOwners?.length || 0));
    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const healthCards = [
    { title: 'Database Tables', value: dbStats.tables, icon: Database, color: 'from-blue-500 to-cyan-500', status: 'healthy' },
    { title: 'Total Records', value: dbStats.records.toLocaleString(), icon: Activity, color: 'from-green-500 to-emerald-500', status: 'healthy' },
    { title: 'Active Sessions', value: activeSessions, icon: Users, color: 'from-purple-500 to-pink-500', status: activeSessions > 0 ? 'healthy' : 'warning' },
    { title: 'Error Logs (24h)', value: errorLogs.length, icon: AlertCircle, color: 'from-orange-500 to-red-500', status: errorLogs.length > 10 ? 'warning' : 'healthy' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button>
        <div><h1 className="text-3xl font-bold gradient-text">System Monitor</h1><p className="text-foreground/60 mt-2">Real-time system health and performance metrics</p></div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {healthCards.map((card, idx) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="glass-hover rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}><card.icon className="w-5 h-5 text-white" /></div>
                <Badge variant={card.status === 'healthy' ? 'default' : 'destructive'}>{card.status === 'healthy' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}{card.status}</Badge>
              </div>
              <p className="text-sm text-foreground/60 mb-1">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </motion.div>
          ))}
        </div>

        <Card className="glass-hover">
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />Recent System Logs</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Action</TableHead><TableHead>Table</TableHead><TableHead>User</TableHead></TableRow></TableHeader>
              <TableBody>
                {errorLogs.map((log) => (
                  <TableRow key={log.log_id}><TableCell className="text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell><TableCell><Badge variant="secondary">{log.action}</Badge></TableCell><TableCell className="font-mono text-xs">{log.table_affected}</TableCell><TableCell className="text-sm text-foreground/60">{log.user_id?.substring(0, 8)}...</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}