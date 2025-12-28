import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

interface NotificationMetadata {
  type?: string;
  student_id?: string;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  title: string;
  message?: string;
  body?: string;
  read: boolean;
  created_at: string;
  metadata?: NotificationMetadata;
}

interface NotificationBellPopoverProps {
  userId: string;
  tableType: 'user' | 'owner';
  variant?: 'default' | 'owner' | 'admin';
}

export function NotificationBellPopover({ 
  userId, 
  tableType,
  variant = 'default'
}: NotificationBellPopoverProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      let data: Notification[] | null = null;
      let error = null;

      if (tableType === 'user') {
        const result = await supabase
          .from('notifications')
          .select('id, title, message, read, created_at, metadata')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        data = result.data as Notification[] | null;
        error = result.error;
      } else {
        const result = await supabase
          .from('owner_notifications')
          .select('id, title, body, read, created_at')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        data = result.data as Notification[] | null;
        error = result.error;
      }

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };

    loadNotifications();

    // Set up realtime subscription
    const tableName = tableType === 'user' ? 'notifications' : 'owner_notifications';
    const filterColumn = tableType === 'user' ? 'user_id' : 'owner_id';
    
    const channel = supabase
      .channel(`${tableName}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `${filterColumn}=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(c => c + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter: `${filterColumn}=eq.${userId}`
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications(prev => {
            const newList = prev.map(n => n.id === updated.id ? updated : n);
            setUnreadCount(newList.filter(n => !n.read).length);
            return newList;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, tableType]);

  const markAsRead = async (notificationId: string) => {
    let error = null;
    
    if (tableType === 'user') {
      const result = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      error = result.error;
    } else {
      const result = await supabase
        .from('owner_notifications')
        .update({ read: true })
        .eq('id', notificationId);
      error = result.error;
    }

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setOpen(false);
    
    const metadata = notification.metadata;
    if (!metadata?.type) return;
    
    switch (metadata.type) {
      case 'friend_request':
      case 'friend_accepted':
        // Navigate to Messages → Friends tab → highlight the student
        navigate('/messages', { 
          state: { 
            activeTab: 'friends',
            highlightStudentId: metadata.student_id 
          }
        });
        break;
      default:
        break;
    }
  };

  const markAllAsRead = async () => {
    if (tableType === 'user') {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    } else {
      await supabase
        .from('owner_notifications')
        .update({ read: true })
        .eq('owner_id', userId)
        .eq('read', false);
    }
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getBadgeClass = () => {
    switch (variant) {
      case 'owner':
        return 'bg-gradient-to-r from-[#6D5BFF] to-[#9A6AFF]';
      case 'admin':
        return 'bg-gradient-to-r from-rose-500 to-purple-600';
      default:
        return 'bg-primary';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-accent/50">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 w-5 h-5 ${getBadgeClass()} text-white text-xs font-bold rounded-full flex items-center justify-center`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          <div className="p-2 space-y-1">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  notification.read
                    ? 'bg-background border-border hover:bg-muted/50'
                    : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.message || notification.body}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No notifications yet</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
