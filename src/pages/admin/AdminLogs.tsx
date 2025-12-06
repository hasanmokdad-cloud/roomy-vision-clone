import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, RefreshCw, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const getActionBadgeVariant = (action: string): "default" | "destructive" | "secondary" | "outline" => {
  const lowerAction = action?.toLowerCase() || '';
  if (lowerAction.includes('error') || lowerAction.includes('fail')) return 'destructive';
  if (lowerAction.includes('verified') || lowerAction.includes('approved') || lowerAction.includes('success')) return 'default';
  if (lowerAction.includes('pending') || lowerAction.includes('warning')) return 'secondary';
  return 'outline';
};

export default function AdminLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [userIdSearch, setUserIdSearch] = useState('');
  const [distinctActions, setDistinctActions] = useState<string[]>([]);
  const [distinctTables, setDistinctTables] = useState<string[]>([]);

  const loadDistinctFilters = async () => {
    // Get distinct actions
    const { data: actionsData } = await supabase
      .from('system_logs')
      .select('action')
      .not('action', 'is', null);
    
    if (actionsData) {
      const uniqueActions = [...new Set(actionsData.map(d => d.action).filter(Boolean))];
      setDistinctActions(uniqueActions.sort());
    }

    // Get distinct tables
    const { data: tablesData } = await supabase
      .from('system_logs')
      .select('table_affected')
      .not('table_affected', 'is', null);
    
    if (tablesData) {
      const uniqueTables = [...new Set(tablesData.map(d => d.table_affected).filter(Boolean))];
      setDistinctTables(uniqueTables.sort());
    }
  };

  const loadLogs = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    let query = supabase
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    // Apply filters
    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }
    if (tableFilter !== 'all') {
      query = query.eq('table_affected', tableFilter);
    }
    if (userIdSearch.trim()) {
      query = query.ilike('user_id', `%${userIdSearch.trim()}%`);
    }

    const { data, count } = await query;
    
    if (data) {
      if (append) {
        setLogs(prev => [...prev, ...data]);
      } else {
        setLogs(data);
      }
      setHasMore(data.length === PAGE_SIZE);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [actionFilter, tableFilter, userIdSearch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await loadLogs(0, false);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await loadLogs(nextPage, true);
  };

  const handleFilterChange = () => {
    setPage(0);
    setLogs([]);
    loadLogs(0, false);
  };

  useEffect(() => {
    loadDistinctFilters();
    loadLogs();
    
    const channel = supabase
      .channel('system-logs-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, () => {
        loadLogs();
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    handleFilterChange();
  }, [actionFilter, tableFilter]);

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
          <h1 className="text-3xl font-bold gradient-text">System Logs</h1>
          <p className="text-foreground/60 mt-2">
            Audit trail of all admin and owner actions
            {totalCount > 0 && <span className="ml-2 text-sm">({totalCount.toLocaleString()} total)</span>}
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
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="All tables" />
                  </SelectTrigger>
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
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <Button variant="secondary" onClick={handleFilterChange} className="w-full">
                  Apply Filters
                </Button>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.table_affected}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.user_id?.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.record_id?.slice(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {hasMore && logs.length > 0 && (
            <div className="p-4 text-center border-t border-border">
              <Button variant="outline" onClick={handleLoadMore}>
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
