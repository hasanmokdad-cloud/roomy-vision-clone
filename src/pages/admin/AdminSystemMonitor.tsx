import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Activity, AlertCircle, Users, Clock, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { format } from 'date-fns';

const getActionBadgeVariant = (action: string): "default" | "destructive" | "secondary" | "outline" => {
  const lowerAction = action?.toLowerCase() || '';
  if (lowerAction.includes('error') || lowerAction.includes('fail')) return 'destructive';
  if (lowerAction.includes('verified') || lowerAction.includes('approved') || lowerAction.includes('success')) return 'default';
  if (lowerAction.includes('pending') || lowerAction.includes('warning')) return 'secondary';
  return 'outline';
};

export default function AdminSystemMonitor() {
  const navigate = useNavigate();
  const [dbStats, setDbStats] = useState({ tables: 0, healthStatus: 'healthy' as 'healthy' | 'warning' });
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const [errorCount24h, setErrorCount24h] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logsLimit, setLogsLimit] = useState(20);

  const loadSystemData = useCallback(async () => {
    try {
      // 1. Database Tables - query security_rls_overview
      const { data: rlsOverview } = await supabase
        .from('security_rls_overview')
        .select('*');
      
      if (rlsOverview) {
        const tableCount = rlsOverview.length;
        // Check if any table has warnings (RLS enabled but no policies, or sensitive without RLS)
        const hasWarnings = rlsOverview.some(t => 
          (t.rls_enabled && t.policy_count === 0) || 
          (t.is_sensitive && !t.rls_enabled)
        );
        setDbStats({ tables: tableCount, healthStatus: hasWarnings ? 'warning' : 'healthy' });
      }

      // 2. Total Records - count from key business tables
      const tables = ['students', 'owners', 'dorms', 'rooms', 'messages', 'bookings', 'reservations', 'payments', 'conversations', 'reviews'];
      let total = 0;
      
      const counts = await Promise.all(tables.map(async (table) => {
        const { count } = await supabase.from(table as any).select('*', { count: 'exact', head: true });
        return count || 0;
      }));
      total = counts.reduce((sum, c) => sum + c, 0);
      setTotalRecords(total);

      // 3. Active Sessions - check user_presence for online users
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count: onlineCount } = await supabase
        .from('user_presence')
        .select('*', { count: 'exact', head: true })
        .or(`is_online.eq.true,last_seen.gte.${fifteenMinutesAgo}`);
      setActiveSessions(onlineCount || 0);

      // 4. Error Logs (24h) - filter system_logs for errors
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: errorLogs } = await supabase
        .from('system_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', twentyFourHoursAgo)
        .or('action.ilike.%error%,action.ilike.%fail%');
      setErrorCount24h(errorLogs || 0);

      // 5. Recent System Logs
      await loadLogs();

    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = async (limit: number = logsLimit) => {
    const { data: logs } = await supabase
      .from('system_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    setRecentLogs(logs || []);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSystemData();
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    const newLimit = logsLimit + 20;
    setLogsLimit(newLimit);
    await loadLogs(newLimit);
  };

  useEffect(() => {
    loadSystemData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemData, 30000);
    
    // Real-time subscription for new logs
    const channel = supabase
      .channel('system-logs-monitor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, () => {
        loadLogs();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [loadSystemData]);

  const healthCards = [
    { 
      title: 'Database Tables', 
      value: dbStats.tables, 
      icon: Database, 
      color: 'from-blue-500 to-cyan-500', 
      status: dbStats.healthStatus 
    },
    { 
      title: 'Total Records', 
      value: totalRecords.toLocaleString(), 
      icon: Activity, 
      color: 'from-green-500 to-emerald-500', 
      status: 'healthy' as const 
    },
    { 
      title: 'Active Sessions', 
      value: activeSessions, 
      icon: Users, 
      color: 'from-purple-500 to-pink-500', 
      status: activeSessions > 0 ? 'healthy' as const : 'warning' as const 
    },
    { 
      title: 'Error Logs (24h)', 
      value: errorCount24h, 
      icon: AlertCircle, 
      color: 'from-orange-500 to-red-500', 
      status: errorCount24h > 10 ? 'warning' as const : 'healthy' as const 
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold gradient-text">System Monitor</h1>
          <p className="text-foreground/60 mt-2">Real-time system health and performance metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {healthCards.map((card, idx) => (
            <motion.div 
              key={card.title} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: idx * 0.1 }} 
              className="glass-hover rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <Badge variant={card.status === 'healthy' ? 'default' : 'destructive'}>
                  {card.status === 'healthy' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                  {card.status}
                </Badge>
              </div>
              <p className="text-sm text-foreground/60 mb-1">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </motion.div>
          ))}
        </div>

        <Card className="glass-hover">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent System Logs
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Auto-refresh: 30s
            </Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Record ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell className="text-sm">
                      {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.table_affected}</TableCell>
                    <TableCell className="text-sm text-foreground/60">
                      {log.user_id?.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.record_id?.substring(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {recentLogs.length >= logsLimit && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={handleLoadMore}>
                  Load More
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
