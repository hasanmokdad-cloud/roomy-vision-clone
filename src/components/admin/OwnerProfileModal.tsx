import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Building2, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OwnerProfileModalProps {
  ownerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OwnerProfileModal({ ownerId, isOpen, onClose }: OwnerProfileModalProps) {
  const navigate = useNavigate();
  const [owner, setOwner] = useState<any>(null);
  const [dorms, setDorms] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && ownerId) {
      loadOwnerData();
    }
  }, [isOpen, ownerId]);

  const loadOwnerData = async () => {
    setLoading(true);
    
    // Load owner profile
    const { data: ownerData } = await supabase
      .from('owners')
      .select('*')
      .eq('id', ownerId)
      .single();
    
    setOwner(ownerData);

    // Load owner's dorms
    const { data: dormsData } = await supabase
      .from('dorms')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    
    setDorms(dormsData || []);

    // Load messages from conversations
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select('id, messages(*), students(full_name)')
      .eq('owner_id', ownerId);
    
    const allMessages = conversationsData?.flatMap(c => 
      c.messages.map((m: any) => ({
        ...m,
        student_name: (c as any).students?.full_name
      }))
    ) || [];
    setMessages(allMessages);

    setLoading(false);
  };

  if (!owner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {owner.full_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="dorms">Properties ({dorms.length})</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{owner.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{owner.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant={owner.status === 'active' ? 'default' : 'destructive'}>
                        {owner.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <p className="font-medium">
                        {new Date(owner.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Verification Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Verified</span>
                      {owner.email_verified ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Phone Verified</span>
                      {owner.phone_verified ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Notification Preferences</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Notifications</span>
                      <Badge variant={owner.notify_email ? 'default' : 'secondary'}>
                        {owner.notify_email ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">WhatsApp Notifications</span>
                      <Badge variant={owner.notify_whatsapp ? 'default' : 'secondary'}>
                        {owner.notify_whatsapp ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    {owner.whatsapp_language && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">WhatsApp Language</span>
                        <Badge variant="outline">{owner.whatsapp_language}</Badge>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{dorms.length}</p>
                      <p className="text-sm text-muted-foreground">Total Properties</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">
                        {dorms.filter(d => d.verification_status === 'Verified').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Verified</p>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dorms">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {dorms.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No properties</p>
                ) : (
                  dorms.map((dorm) => (
                    <Card key={dorm.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 mt-1 text-primary" />
                          <div>
                            <h4 className="font-semibold">{dorm.dorm_name || dorm.name}</h4>
                            <p className="text-sm text-muted-foreground">{dorm.area || dorm.location}</p>
                            <p className="text-sm font-medium mt-1">${dorm.monthly_price || dorm.price}/month</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={dorm.verification_status === 'Verified' ? 'default' : 'secondary'}>
                            {dorm.verification_status}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              onClose();
                              navigate(`/dorm/${dorm.id}`);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="messages">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No messages</p>
                ) : (
                  messages.map((msg) => (
                    <Card key={msg.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 mt-1 text-blue-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {msg.sender_id === owner.user_id ? 'Owner' : msg.student_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{msg.body}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}