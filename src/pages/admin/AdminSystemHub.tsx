import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Database, Activity, AlertCircle, Users, Clock, CheckCircle, ArrowLeft, RefreshCw, Search, Filter, Shield, XCircle, Bell, TableIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface RLSOverviewRow {
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
  select_policies: number;
  insert_policies: number;
  update_policies: number;
  delete_policies: number;
  is_sensitive: boolean;
  security_status: string;
}

const getActionBadgeVariant = (action: string): "default" | "destructive" | "secondary" | "outline" => {
  const lowerAction = action?.toLowerCase() || '';
  if (lowerAction.includes('error') || lowerAction.includes('fail')) return 'destructive';
  if (lowerAction.includes('verified') || lowerAction.includes('approved') || lowerAction.includes('success')) return 'default';
  if (lowerAction.includes('pending') || lowerAction.includes('warning')) return 'secondary';
  return 'outline';
};

export default function AdminSystemHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const activeTab = searchParams.get('tab') || 'monitor';
  
  // Monitor state
  const [dbStats, setDbStats] = useState({ tables: 0, healthStatus: 'healthy' as 'healthy' | 'warning' });
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const [errorCount24h, setErrorCount24h] = useState(0);
  const [recentMonitorLogs, setRecentMonitorLogs] = useState<any[]>([]);
  
  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsPage, setLogsPage] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [userIdSearch, setUserIdSearch] = useState('');
  const [distinctActions, setDistinctActions] = useState<string[]>([]);
  const [distinctTables, setDistinctTables] = useState<string[]>([]);
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [notificationStats, setNotificationStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 });
  
  // RLS state
  const [rlsErrors, setRlsErrors] = useState<any[]>([]);
  const [rlsOverview, setRlsOverview] = useState<RLSOverviewRow[]>([]);
  const [authState, setAuthState] = useState<any>(null);
  const [realtimeErrors, setRealtimeErrors] = useState<any[]>([]);

  const PAGE_SIZE = 50;

  useEffect(() => {
    loadAllData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === 'monitor') loadMonitorData();
    }, 30000);
    
    // Real-time subscriptions
    const logsChannel = supabase
      .channel('system-logs-hub')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, () => {
        if (activeTab === 'logs') loadLogs(0, false);
        if (activeTab === 'monitor') loadMonitorData();
      })
      .subscribe();

    const rlsChannel = supabase
      .channel('rls-errors-hub')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rls_errors_log' }, (payload) => {
        setRealtimeErrors(prev => [payload.new, ...prev].slice(0, 50));
        toast({
          title: 'New RLS Error Detected',
          description: `Table: ${payload.new.table_name}, Operation: ${payload.new.operation}`,
          variant: 'destructive',
        });
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(rlsChannel);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadDistinctFilters();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'logs') {
      setLogsPage(0);
      setLogs([]);
      loadLogs(0, false);
    }
  }, [actionFilter, tableFilter, activeTab]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotifications();
    }
  }, [statusFilter, eventFilter, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadMonitorData(),
      loadLogs(0, false),
      loadDistinctFilters(),
      loadNotifications(),
      loadRLSData(),
    ]);
    setLoading(false);
  };

  const loadMonitorData = useCallback(async () => {
    try {
      const { data: rlsOverview } = await supabase.from('security_rls_overview').select('*');
      
      if (rlsOverview) {
        const tableCount = rlsOverview.length;
        const hasWarnings = rlsOverview.some(t => 
          (t.rls_enabled && t.policy_count === 0) || 
          (t.is_sensitive && !t.rls_enabled)
        );
        setDbStats({ tables: tableCount, healthStatus: hasWarnings ? 'warning' : 'healthy' });
      }

      const tables = ['students', 'owners', 'dorms', 'rooms', 'messages', 'bookings', 'reservations', 'payments', 'conversations', 'reviews'];
      const counts = await Promise.all(tables.map(async (table) => {
        const { count } = await supabase.from(table as any).select('*', { count: 'exact', head: true });
        return count || 0;
      }));
      setTotalRecords(counts.reduce((sum, c) => sum + c, 0));

      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count: onlineCount } = await supabase
        .from('user_presence')
        .select('*', { count: 'exact', head: true })
        .or(`is_online.eq.true,last_seen.gte.${fifteenMinutesAgo}`);
      setActiveSessions(onlineCount || 0);

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: errorLogs } = await supabase
        .from('system_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', twentyFourHoursAgo)
        .or('action.ilike.%error%,action.ilike.%fail%');
      setErrorCount24h(errorLogs || 0);

      const { data: recentLogs } = await supabase
        .from('system_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);
      setRecentMonitorLogs(recentLogs || []);
    } catch (error) {
      console.error('Error loading monitor data:', error);
    }
  }, []);

  const loadLogs = async (pageNum: number = 0, append: boolean = false) => {
    let query = supabase
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (actionFilter !== 'all') query = query.eq('action', actionFilter);
    if (tableFilter !== 'all') query = query.eq('table_affected', tableFilter);
    if (userIdSearch.trim()) query = query.ilike('user_id', `%${userIdSearch.trim()}%`);

    const { data, count } = await query;
    
    if (data) {
      if (append) {
        setLogs(prev => [...prev, ...data]);
      } else {
        setLogs(data);
      }
      setHasMoreLogs(data.length === PAGE_SIZE);
      setTotalLogsCount(count || 0);
    }
  };

  const loadDistinctFilters = async () => {
    const { data: actionsData } = await supabase.from('system_logs').select('action').not('action', 'is', null);
    if (actionsData) {
      setDistinctActions([...new Set(actionsData.map(d => d.action).filter(Boolean))].sort());
    }

    const { data: tablesData } = await supabase.from('system_logs').select('table_affected').not('table_affected', 'is', null);
    if (tablesData) {
      setDistinctTables([...new Set(tablesData.map(d => d.table_affected).filter(Boolean))].sort());
    }
  };

  const loadNotifications = async () => {
    let query = supabase
      .from('notifications_log')
      .select(`*, owner:owners(full_name, email), dorm:dorms(dorm_name, name)`)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (eventFilter !== 'all') query = query.eq('event_type', eventFilter);

    const { data } = await query;
    if (data) {
      setNotifications(data);
      setNotificationStats({
        total: data.length,
        sent: data.filter(n => n.status === 'sent').length,
        failed: data.filter(n => n.status === 'failed').length,
        pending: data.filter(n => n.status === 'pending').length,
      });
    }
  };

  const loadRLSData = async () => {
    try {
      const { data: errors } = await supabase
        .from('rls_errors_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setRlsErrors(errors || []);

      const { data: overview } = await supabase
        .from('security_rls_overview')
        .select('*')
        .order('table_name');
      setRlsOverview((overview as RLSOverviewRow[]) || []);

      try {
        const { data: authData } = await supabase.rpc('debug_auth_state');
        setAuthState(authData);
      } catch (e) {
        console.error('Error checking auth state:', e);
      }
    } catch (error) {
      console.error('Error loading RLS data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast({ title: 'Refreshed', description: 'All data updated.' });
  };

  const handleLoadMoreLogs = async () => {
    const nextPage = logsPage + 1;
    setLogsPage(nextPage);
    await loadLogs(nextPage, true);
  };

  const handleRetryFailedNotifications = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('process-pending-notifications');
      if (response.error) throw response.error;
      toast({ title: 'Success', description: `Processed ${response.data?.processed || 0} pending notifications` });
      await loadNotifications();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to retry notifications', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLogsFilter = () => {
    setLogsPage(0);
    setLogs([]);
    loadLogs(0, false);
  };

  const healthCards = [
    { title: 'Database Tables', value: dbStats.tables, icon: Database, color: 'from-blue-500 to-cyan-500', status: dbStats.healthStatus },
    { title: 'Total Records', value: totalRecords.toLocaleString(), icon: Activity, color: 'from-green-500 to-emerald-500', status: 'healthy' as const },
    { title: 'Active Sessions', value: activeSessions, icon: Users, color: 'from-purple-500 to-pink-500', status: activeSessions > 0 ? 'healthy' as const : 'warning' as const },
    { title: 'Error Logs (24h)', value: errorCount24h, icon: AlertCircle, color: 'from-orange-500 to-red-500', status: errorCount24h > 10 ? 'warning' as const : 'healthy' as const },
  ];

  const rlsStats = {
    totalTables: rlsOverview.length,
    rlsEnabled: rlsOverview.filter(t => t.rls_enabled).length,
    withWarnings: rlsOverview.filter(t => 
      (t.rls_enabled && t.policy_count === 0) || 
      (t.is_sensitive && !t.rls_enabled) ||
      (t.rls_enabled && t.select_policies === 0)
    ).length,
  };

  const ErrorCard = ({ error }: { error: any }) => (
    <Card className="p-4 mb-2 border-destructive/50">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-destructive mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="destructive">{error.operation}</Badge>
            <Badge variant="outline">{error.table_name}</Badge>
            <span className="text-xs text-muted-foreground">{new Date(error.created_at).toLocaleString()}</span>
          </div>
          <p className="text-sm mb-2">{error.error_message}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">User ID:</span>{' '}
              <code className="bg-muted px-1 py-0.5 rounded">{error.user_id?.slice(0, 8) || 'NULL'}...</code>
            </div>
            <div>
              <span className="text-muted-foreground">Auth UID:</span>{' '}
              <code className="bg-muted px-1 py-0.5 rounded">{error.auth_uid?.slice(0, 8) || 'NULL'}...</code>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">System & Logs</h1>
              <p className="text-foreground/60 mt-2">Monitor system health, logs, notifications, and security</p>
            </div>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="monitor" className="gap-2">
              <Activity className="h-4 w-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Database className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="rls" className="gap-2">
              <Shield className="h-4 w-4" />
              RLS Debugger
            </TabsTrigger>
          </TabsList>

          {/* MONITOR TAB */}
          <TabsContent value="monitor" className="space-y-6 mt-6">
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
                <Badge variant="outline" className="text-xs">Auto-refresh: 30s</Badge>
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
                    {recentMonitorLogs.map((log) => (
                      <TableRow key={log.log_id}>
                        <TableCell className="text-sm">{log.timestamp ? format(new Date(log.timestamp), 'MMM dd, HH:mm:ss') : '-'}</TableCell>
                        <TableCell><Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{log.table_affected}</TableCell>
                        <TableCell className="text-sm text-foreground/60">{log.user_id?.substring(0, 8)}...</TableCell>
                        <TableCell className="font-mono text-xs">{log.record_id?.substring(0, 8)}...</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LOGS TAB */}
          <TabsContent value="logs" className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-bold">System Logs</h2>
              <p className="text-foreground/60">
                Audit trail of all admin and owner actions
                {totalLogsCount > 0 && <span className="ml-2 text-sm">({totalLogsCount.toLocaleString()} total)</span>}
              </p>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Action</label>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger><SelectValue placeholder="All actions" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All actions</SelectItem>
                        {distinctActions.map(action => (
                          <SelectItem key={action} value={action}>{action}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Table</label>
                    <Select value={tableFilter} onValueChange={setTableFilter}>
                      <SelectTrigger><SelectValue placeholder="All tables" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All tables</SelectItem>
                        {distinctTables.map(table => (
                          <SelectItem key={table} value={table}>{table}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">User ID</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search user ID..." 
                        value={userIdSearch}
                        onChange={(e) => setUserIdSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyLogsFilter()}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <Button variant="secondary" onClick={handleApplyLogsFilter} className="w-full">Apply Filters</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="glass-hover rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Record ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No logs found</TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.log_id}>
                        <TableCell>{log.timestamp ? format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss') : '-'}</TableCell>
                        <TableCell><Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{log.table_affected}</TableCell>
                        <TableCell className="font-mono text-xs">{log.user_id?.slice(0, 8)}...</TableCell>
                        <TableCell className="font-mono text-xs">{log.record_id?.slice(0, 8)}...</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {hasMoreLogs && logs.length > 0 && (
                <div className="p-4 text-center border-t border-border">
                  <Button variant="outline" onClick={handleLoadMoreLogs}>Load More</Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Notification Logs</h2>
                <p className="text-foreground/60">Track all email notifications sent to owners</p>
              </div>
              <Button onClick={handleRetryFailedNotifications} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Retry Failed
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-hover rounded-2xl p-6">
                <p className="text-sm text-foreground/60 mb-1">Total Sent</p>
                <p className="text-3xl font-bold">{notificationStats.total}</p>
              </div>
              <div className="glass-hover rounded-2xl p-6">
                <p className="text-sm text-foreground/60 mb-1">Successful</p>
                <p className="text-3xl font-bold text-green-400">{notificationStats.sent}</p>
              </div>
              <div className="glass-hover rounded-2xl p-6">
                <p className="text-sm text-foreground/60 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-400">{notificationStats.failed}</p>
              </div>
              <div className="glass-hover rounded-2xl p-6">
                <p className="text-sm text-foreground/60 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-400">{notificationStats.pending}</p>
              </div>
            </div>

            <div className="glass-hover rounded-2xl p-6">
              <div className="flex gap-4 mb-6 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by event" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="edited">Edited</SelectItem>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Dorm</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell>{format(new Date(n.sent_at), 'MMM dd, HH:mm')}</TableCell>
                        <TableCell><Badge>{n.event_type}</Badge></TableCell>
                        <TableCell>{n.dorm?.dorm_name || n.dorm?.name || 'N/A'}</TableCell>
                        <TableCell>{n.owner?.full_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={n.status === 'sent' ? 'default' : n.status === 'failed' ? 'destructive' : 'secondary'}>
                            {n.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* RLS DEBUGGER TAB */}
          <TabsContent value="rls" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  RLS Security Debugger
                </h2>
                <p className="text-foreground/60">Monitor and debug Row Level Security policies</p>
              </div>
            </div>

            {/* RLS Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Total Tables</h4>
                <p className="text-3xl font-bold">{rlsStats.totalTables}</p>
              </Card>
              <Card className="p-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">RLS Enabled</h4>
                <p className="text-3xl font-bold text-green-500">{rlsStats.rlsEnabled}</p>
              </Card>
              <Card className="p-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tables with Warnings</h4>
                <p className="text-3xl font-bold text-yellow-500">{rlsStats.withWarnings}</p>
              </Card>
              <Card className="p-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">RLS Errors (Total)</h4>
                <p className="text-3xl font-bold text-destructive">{rlsErrors.length}</p>
              </Card>
            </div>

            <Tabs defaultValue="errors" className="space-y-4">
              <TabsList className="grid grid-cols-4 max-w-md">
                <TabsTrigger value="errors"><AlertCircle className="w-4 h-4 mr-2" />Errors</TabsTrigger>
                <TabsTrigger value="realtime"><Activity className="w-4 h-4 mr-2" />Live</TabsTrigger>
                <TabsTrigger value="tables"><TableIcon className="w-4 h-4 mr-2" />Tables</TabsTrigger>
                <TabsTrigger value="auth"><Users className="w-4 h-4 mr-2" />Auth</TabsTrigger>
              </TabsList>

              <TabsContent value="errors">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent RLS Errors</h3>
                  {rlsErrors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>No RLS errors detected. System is healthy!</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      {rlsErrors.map((error) => (
                        <ErrorCard key={error.id} error={error} />
                      ))}
                    </ScrollArea>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="realtime">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Live Error Monitor</h3>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Activity className="w-3 h-3 animate-pulse" />
                      Active
                    </Badge>
                  </div>
                  {realtimeErrors.length === 0 ? (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Monitoring for real-time RLS errors. New errors will appear here instantly.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      {realtimeErrors.map((error, idx) => (
                        <ErrorCard key={idx} error={error} />
                      ))}
                    </ScrollArea>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="tables">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">All Tables RLS Status</h3>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Table</TableHead>
                          <TableHead>RLS</TableHead>
                          <TableHead>Policies</TableHead>
                          <TableHead>SELECT</TableHead>
                          <TableHead>INSERT</TableHead>
                          <TableHead>UPDATE</TableHead>
                          <TableHead>DELETE</TableHead>
                          <TableHead>Sensitive</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rlsOverview.map((table) => {
                          const hasWarning = (table.rls_enabled && table.policy_count === 0) || 
                            (table.is_sensitive && !table.rls_enabled) ||
                            (table.rls_enabled && table.select_policies === 0);
                          
                          return (
                            <TableRow key={table.table_name} className={hasWarning ? 'bg-destructive/10' : ''}>
                              <TableCell className="font-mono text-sm">{table.table_name}</TableCell>
                              <TableCell>
                                <Badge variant={table.rls_enabled ? 'default' : 'destructive'}>
                                  {table.rls_enabled ? 'ON' : 'OFF'}
                                </Badge>
                              </TableCell>
                              <TableCell>{table.policy_count}</TableCell>
                              <TableCell><Badge variant={table.select_policies > 0 ? 'outline' : 'secondary'}>{table.select_policies}</Badge></TableCell>
                              <TableCell>{table.insert_policies}</TableCell>
                              <TableCell>{table.update_policies}</TableCell>
                              <TableCell>{table.delete_policies}</TableCell>
                              <TableCell>{table.is_sensitive && <Badge variant="secondary">Yes</Badge>}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </Card>
              </TabsContent>

              <TabsContent value="auth">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Current Authentication State</h3>
                  <Button onClick={loadRLSData} variant="outline" size="sm" className="mb-4">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Auth State
                  </Button>
                  
                  {authState ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Auth UID</p>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{authState.auth_uid || 'NULL'}</code>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Roles</p>
                          <div className="flex gap-1">
                            {authState.roles?.map((role: string) => (
                              <Badge key={role} variant="secondary">{role}</Badge>
                            )) || <span className="text-sm text-muted-foreground">No roles</span>}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Owner ID</p>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{authState.owner_id || 'N/A'}</code>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Student ID</p>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{authState.student_id || 'N/A'}</code>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Click refresh to check current auth state</p>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
