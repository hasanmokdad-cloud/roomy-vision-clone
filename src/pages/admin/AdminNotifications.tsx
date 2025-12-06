import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, [statusFilter, eventFilter, channelFilter, languageFilter]);

  const loadNotifications = async () => {
    let query = supabase
      .from('notifications_log')
      .select(`*, owner:owners(full_name, email), dorm:dorms(dorm_name, name)`)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (eventFilter !== 'all') query = query.eq('event_type', eventFilter);
    if (channelFilter !== 'all') query = query.eq('channel', channelFilter);
    if (languageFilter !== 'all') query = query.eq('language', languageFilter);

    const { data, error } = await query;
    if (!error && data) setNotifications(data);
    setLoading(false);
  };

  const handleRetryFailed = async () => {
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

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    pending: notifications.filter(n => n.status === 'pending').length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Notification Logs</h1>
            <p className="text-foreground/60 mt-2">Track all email notifications sent to owners</p>
          </div>
          <Button onClick={handleRetryFailed} disabled={loading} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry Failed
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-hover rounded-2xl p-6"><p className="text-sm text-foreground/60 mb-1">Total Sent</p><p className="text-3xl font-bold">{stats.total}</p></div>
          <div className="glass-hover rounded-2xl p-6"><p className="text-sm text-foreground/60 mb-1">Successful</p><p className="text-3xl font-bold text-green-400">{stats.sent}</p></div>
          <div className="glass-hover rounded-2xl p-6"><p className="text-sm text-foreground/60 mb-1">Failed</p><p className="text-3xl font-bold text-red-400">{stats.failed}</p></div>
          <div className="glass-hover rounded-2xl p-6"><p className="text-sm text-foreground/60 mb-1">Pending</p><p className="text-3xl font-bold text-yellow-400">{stats.pending}</p></div>
        </div>

        <div className="glass-hover rounded-2xl p-6">
          <div className="flex gap-4 mb-6 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select>
            <Select value={eventFilter} onValueChange={setEventFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by event" /></SelectTrigger><SelectContent><SelectItem value="all">All Events</SelectItem><SelectItem value="verified">Verified</SelectItem><SelectItem value="edited">Edited</SelectItem><SelectItem value="inquiry">Inquiry</SelectItem></SelectContent></Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Event</TableHead><TableHead>Dorm</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {notifications.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>{format(new Date(n.sent_at), 'MMM dd, HH:mm')}</TableCell>
                    <TableCell><Badge>{n.event_type}</Badge></TableCell>
                    <TableCell>{n.dorm?.dorm_name || n.dorm?.name || 'N/A'}</TableCell>
                    <TableCell>{n.owner?.full_name || 'Unknown'}</TableCell>
                    <TableCell><Badge variant={n.status === 'sent' ? 'default' : n.status === 'failed' ? 'destructive' : 'secondary'}>{n.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}