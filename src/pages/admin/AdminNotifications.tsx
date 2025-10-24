import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
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

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications_log'
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, eventFilter, channelFilter]);

  const loadNotifications = async () => {
    let query = supabase
      .from('notifications_log')
      .select(`
        *,
        owner:owners(full_name, email),
        dorm:dorms(dorm_name, name)
      `)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (eventFilter !== 'all') {
      query = query.eq('event_type', eventFilter);
    }

    if (channelFilter !== 'all') {
      query = query.eq('channel', channelFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const handleRetryFailed = async () => {
    try {
      setLoading(true);
      const response = await supabase.functions.invoke('process-pending-notifications');
      
      if (response.error) throw response.error;
      
      toast({
        title: 'Success',
        description: `Processed ${response.data?.processed || 0} pending notifications`,
      });
      
      await loadNotifications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to retry notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading notifications...</div>;
  }

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    pending: notifications.filter(n => n.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Notification Logs</h1>
          <p className="text-foreground/60 mt-2">Track all email notifications sent to owners</p>
        </div>
        <Button
          onClick={handleRetryFailed}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Failed
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-hover rounded-2xl p-6">
          <p className="text-sm text-foreground/60 mb-1">Total Sent</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="glass-hover rounded-2xl p-6">
          <p className="text-sm text-foreground/60 mb-1">Successful</p>
          <p className="text-3xl font-bold text-green-400">{stats.sent}</p>
        </div>
        <div className="glass-hover rounded-2xl p-6">
          <p className="text-sm text-foreground/60 mb-1">Failed</p>
          <p className="text-3xl font-bold text-red-400">{stats.failed}</p>
        </div>
        <div className="glass-hover rounded-2xl p-6">
          <p className="text-sm text-foreground/60 mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
        </div>
      </div>

      <div className="glass-hover rounded-2xl p-6">
        <div className="flex gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>

          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="edited">Edited</SelectItem>
              <SelectItem value="inquiry">Inquiry</SelectItem>
            </SelectContent>
          </Select>

          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Dorm</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    {format(new Date(notification.sent_at), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={notification.event_type === 'verified' ? 'default' : 'secondary'}>
                      {notification.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {notification.channel || 'email'}
                    </Badge>
                  </TableCell>
                  <TableCell>{notification.dorm?.dorm_name || notification.dorm?.name || 'N/A'}</TableCell>
                  <TableCell>{notification.owner?.full_name || 'Unknown'}</TableCell>
                  <TableCell className="font-mono text-xs">{notification.sent_to}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        notification.status === 'sent'
                          ? 'default'
                          : notification.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {notification.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-foreground/60">
                    {notification.error_message || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
