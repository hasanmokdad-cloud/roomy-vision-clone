import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { findExistingSupportConversation } from '@/lib/messagingSupport';
import {
  Mail,
  MailOpen,
  Archive,
  CheckCheck,
  Trash2,
  Calendar,
  User,
  Building2,
  MessageSquare,
  Filter,
  ArrowLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface ContactMessage {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  university: string | null;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
  admin_notes: string | null;
}

export default function AdminMessagesInbox() {
  const { loading } = useRoleGuard('admin');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  useEffect(() => {
    if (!loading) {
      loadMessages();
    }
  }, [loading]);

  useEffect(() => {
    filterMessages();
  }, [messages, statusFilter]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } else {
      setMessages((data || []) as ContactMessage[]);
    }
    setLoadingData(false);
  };

  const filterMessages = () => {
    if (statusFilter === 'all') {
      setFilteredMessages(messages);
    } else {
      setFilteredMessages(messages.filter((m) => m.status === statusFilter));
    }
  };

  const updateMessageStatus = async (id: string, status: string, additionalUpdates = {}) => {
    const updates: any = { status, ...additionalUpdates };
    
    if (status === 'read' && !selectedMessage?.read_at) {
      updates.read_at = new Date().toISOString();
    }
    if (status === 'replied') {
      updates.replied_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('contact_messages')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update message status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Message marked as ${status}`,
      });
      loadMessages();
      setSelectedMessage(null);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message? This cannot be undone.')) {
      return;
    }

    const { error } = await supabase.from('contact_messages').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: 'Message deleted successfully',
      });
      loadMessages();
      setSelectedMessage(null);
    }
  };

  const openConversation = async (contactMessage: ContactMessage) => {
    if (!contactMessage.user_id) {
      toast({
        title: "Cannot Open Conversation",
        description: "This message was submitted anonymously (no user account).",
        variant: "destructive",
      });
      return;
    }

    try {
      const conversationId = await findExistingSupportConversation(contactMessage.user_id);

      if (conversationId) {
        navigate('/messages', {
          state: { selectedConversationId: conversationId }
        });
      } else {
        toast({
          title: "No Conversation Found",
          description: "This user hasn't started a support conversation yet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[AdminInbox] Error opening conversation:", error);
      toast({
        title: "Error",
        description: "Failed to open conversation",
        variant: "destructive",
      });
    }
  };

  const saveAdminNotes = async () => {
    if (!selectedMessage) return;

    const { error } = await supabase
      .from('contact_messages')
      .update({ admin_notes: adminNotes })
      .eq('id', selectedMessage.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Saved',
        description: 'Admin notes saved successfully',
      });
      setShowNotesDialog(false);
      loadMessages();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      read: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      replied: 'bg-green-500/10 text-green-500 border-green-500/20',
      archived: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return variants[status as keyof typeof variants] || variants.new;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      new: Mail,
      read: MailOpen,
      replied: CheckCheck,
      archived: Archive,
    };
    const Icon = icons[status as keyof typeof icons] || Mail;
    return <Icon className="w-4 h-4" />;
  };

  const stats = {
    total: messages.length,
    new: messages.filter((m) => m.status === 'new').length,
    read: messages.filter((m) => m.status === 'read').length,
    replied: messages.filter((m) => m.status === 'replied').length,
    archived: messages.filter((m) => m.status === 'archived').length,
  };

  if (loading || loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Messages Inbox</h1>
            <p className="text-foreground/60">Contact form submissions from visitors</p>
          </div>
          <Button onClick={loadMessages} variant="outline">
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-foreground/60">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4 border-blue-500/20 bg-blue-500/5">
            <div className="text-sm text-blue-500 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              New
            </div>
            <div className="text-2xl font-bold text-blue-500">{stats.new}</div>
          </Card>
          <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
            <div className="text-sm text-yellow-500 flex items-center gap-2">
              <MailOpen className="w-4 h-4" />
              Read
            </div>
            <div className="text-2xl font-bold text-yellow-500">{stats.read}</div>
          </Card>
          <Card className="p-4 border-green-500/20 bg-green-500/5">
            <div className="text-sm text-green-500 flex items-center gap-2">
              <CheckCheck className="w-4 h-4" />
              Replied
            </div>
            <div className="text-2xl font-bold text-green-500">{stats.replied}</div>
          </Card>
          <Card className="p-4 border-gray-500/20 bg-gray-500/5">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Archived
            </div>
            <div className="text-2xl font-bold text-gray-500">{stats.archived}</div>
          </Card>
        </div>

        {/* Filter */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-foreground/60" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="new">New Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
                <SelectItem value="replied">Replied Only</SelectItem>
                <SelectItem value="archived">Archived Only</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-foreground/60">
              Showing {filteredMessages.length} of {messages.length} messages
            </span>
          </div>
        </Card>

        {/* Messages List */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <Card className="p-8 text-center">
                <Mail className="w-12 h-12 mx-auto text-foreground/20 mb-4" />
                <p className="text-foreground/60">No messages found</p>
              </Card>
            ) : (
              filteredMessages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedMessage?.id === msg.id ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (msg.status === 'new') {
                        updateMessageStatus(msg.id, 'read');
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-foreground/60" />
                        <span className="font-semibold">
                          {msg.first_name} {msg.last_name}
                        </span>
                      </div>
                      <Badge className={getStatusBadge(msg.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(msg.status)}
                          {msg.status}
                        </span>
                      </Badge>
                    </div>
                    <div className="text-sm text-foreground/60 mb-2">{msg.email}</div>
                    {msg.university && (
                      <div className="flex items-center gap-1 text-sm text-foreground/60 mb-2">
                        <Building2 className="w-3 h-3" />
                        {msg.university}
                      </div>
                    )}
                    <p className="text-sm text-foreground/80 line-clamp-2 mb-2">{msg.message}</p>
                    <div className="flex items-center gap-1 text-xs text-foreground/40">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(msg.created_at), 'PPpp')}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Message Details */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            {selectedMessage ? (
              <Card className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      {selectedMessage.first_name} {selectedMessage.last_name}
                    </h2>
                    <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                      {selectedMessage.email}
                    </a>
                  </div>
                  <Badge className={getStatusBadge(selectedMessage.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(selectedMessage.status)}
                      {selectedMessage.status}
                    </span>
                  </Badge>
                </div>

                {selectedMessage.university && (
                  <div className="flex items-center gap-2 text-foreground/60">
                    <Building2 className="w-4 h-4" />
                    <span>{selectedMessage.university}</span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-foreground/60 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </div>
                  <p className="text-foreground/90 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="pt-4 border-t text-sm text-foreground/60 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Submitted: {format(new Date(selectedMessage.created_at), 'PPpp')}
                  </div>
                  {selectedMessage.read_at && (
                    <div className="flex items-center gap-2">
                      <MailOpen className="w-4 h-4" />
                      Read: {format(new Date(selectedMessage.read_at), 'PPpp')}
                    </div>
                  )}
                  {selectedMessage.replied_at && (
                    <div className="flex items-center gap-2">
                      <CheckCheck className="w-4 h-4" />
                      Replied: {format(new Date(selectedMessage.replied_at), 'PPpp')}
                    </div>
                  )}
                </div>

                {selectedMessage.admin_notes && (
                  <div className="pt-4 border-t">
                    <div className="text-sm font-semibold text-foreground/80 mb-2">Admin Notes</div>
                    <p className="text-sm text-foreground/60 whitespace-pre-wrap">{selectedMessage.admin_notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'replied')}
                      disabled={selectedMessage.status === 'replied'}
                      variant="outline"
                      className="w-full"
                    >
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Mark Replied
                    </Button>
                    <Button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'archived')}
                      disabled={selectedMessage.status === 'archived'}
                      variant="outline"
                      className="w-full"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                  </div>
                  <Button
                    onClick={() => openConversation(selectedMessage)}
                    disabled={!selectedMessage.user_id}
                    variant="outline"
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open Conversation
                  </Button>
                  <Button
                    onClick={() => {
                      setAdminNotes(selectedMessage.admin_notes || '');
                      setShowNotesDialog(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {selectedMessage.admin_notes ? 'Edit Notes' : 'Add Notes'}
                  </Button>
                  <Button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-foreground/20 mb-4" />
                <p className="text-foreground/60">Select a message to view details</p>
              </Card>
            )}
          </div>
        </div>

        {/* Notes Dialog */}
        <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Admin Notes</DialogTitle>
              <DialogDescription>
                Add internal notes about this message
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter notes..."
              rows={5}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveAdminNotes}>Save Notes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}