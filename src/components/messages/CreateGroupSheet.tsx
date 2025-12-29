import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, X, Search, ArrowRight, Users, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

interface Contact {
  id: string;
  user_id: string;
  name: string;
  avatar?: string | null;
  role: 'Student' | 'Owner' | 'Admin';
}

interface CreateGroupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onGroupCreated: (conversationId: string) => void;
}

export function CreateGroupSheet({ open, onOpenChange, userId, onGroupCreated }: CreateGroupSheetProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load contacts when sheet opens
  useEffect(() => {
    if (open && userId) {
      loadContacts();
    }
  }, [open, userId]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setStep('select');
      setSearchQuery('');
      setSelectedContacts(new Set());
      setGroupName('');
      setGroupPhoto(null);
    }
  }, [open]);

  const loadContacts = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Get all conversations to find contacts
      const { data: conversations } = await supabase
        .from('conversations')
        .select('user_a_id, user_b_id, student_id, owner_id')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

      if (!conversations) {
        setLoading(false);
        return;
      }

      // Extract unique user IDs
      const userIds = new Set<string>();
      conversations.forEach(conv => {
        if (conv.user_a_id && conv.user_a_id !== userId) userIds.add(conv.user_a_id);
        if (conv.user_b_id && conv.user_b_id !== userId) userIds.add(conv.user_b_id);
      });

      // Fetch user details from students and owners tables
      const contactList: Contact[] = [];
      
      for (const id of userIds) {
        // Check students
        const { data: student } = await supabase
          .from('students')
          .select('id, user_id, full_name, profile_photo_url')
          .eq('user_id', id)
          .single();
        
        if (student) {
          contactList.push({
            id: student.id,
            user_id: student.user_id,
            name: student.full_name,
            avatar: student.profile_photo_url,
            role: 'Student'
          });
          continue;
        }

        // Check owners
        const { data: owner } = await supabase
          .from('owners')
          .select('id, user_id, full_name, profile_photo_url')
          .eq('user_id', id)
          .single();
        
        if (owner) {
          contactList.push({
            id: owner.id,
            user_id: owner.user_id,
            name: owner.full_name,
            avatar: owner.profile_photo_url,
            role: 'Owner'
          });
        }
      }

      setContacts(contactList);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
    
    setLoading(false);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContact = (userId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedContacts(newSelected);
  };

  const handleNext = () => {
    if (selectedContacts.size < 1) {
      toast({ title: 'Select at least 1 member', variant: 'destructive' });
      return;
    }
    setStep('details');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({ title: 'Enter a group name', variant: 'destructive' });
      return;
    }
    if (!userId) return;

    setIsCreating(true);

    try {
      // Create the group conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          is_group: true,
          group_name: groupName.trim(),
          group_photo_url: groupPhoto,
          created_by: userId,
          conversation_type: 'group',
          user_a_id: userId, // Creator
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add creator as admin
      await supabase.from('group_members').insert({
        conversation_id: conversation.id,
        user_id: userId,
        role: 'admin',
        added_by: userId,
      });

      // Add selected members
      const memberInserts = Array.from(selectedContacts).map(contactUserId => ({
        conversation_id: conversation.id,
        user_id: contactUserId,
        role: 'member' as const,
        added_by: userId,
      }));

      if (memberInserts.length > 0) {
        await supabase.from('group_members').insert(memberInserts);
      }

      // Send initial system message
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: userId,
        body: `${groupName} group created`,
        type: 'system',
      });

      toast({ title: 'Group created!' });
      onGroupCreated(conversation.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating group:', error);
      toast({ title: 'Failed to create group', variant: 'destructive' });
    }

    setIsCreating(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `group-${Date.now()}.${fileExt}`;
      const filePath = `group-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      setGroupPhoto(data.publicUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({ title: 'Failed to upload photo', variant: 'destructive' });
    }
  };

  const selectedContactsList = contacts.filter(c => selectedContacts.has(c.user_id));

  const content = (
    <div className="flex flex-col h-full">
      <AnimatePresence mode="wait">
        {step === 'select' ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col flex-1"
          >
            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Selected chips */}
            {selectedContacts.size > 0 && (
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-2">
                  {selectedContactsList.map(contact => (
                    <div
                      key={contact.user_id}
                      className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full pl-1 pr-2 py-1"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={contact.avatar || undefined} />
                        <AvatarFallback className="text-xs">{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{contact.name.split(' ')[0]}</span>
                      <button onClick={() => toggleContact(contact.user_id)}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact list */}
            <ScrollArea className="flex-1">
              <div className="px-2">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No contacts found</div>
                ) : (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.user_id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => toggleContact(contact.user_id)}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={contact.avatar || undefined} />
                          <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {selectedContacts.has(contact.user_id) && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.role}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Next button */}
            <div className="p-4 border-t">
              <Button
                onClick={handleNext}
                disabled={selectedContacts.size < 1}
                className="w-full gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col flex-1"
          >
            {/* Group photo and name */}
            <div className="flex flex-col items-center gap-4 p-6">
              <label className="relative cursor-pointer group">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={groupPhoto || undefined} />
                  <AvatarFallback className="bg-primary/10">
                    <Users className="w-10 h-10 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              <Input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="text-center text-lg font-medium max-w-xs"
                autoFocus
              />
            </div>

            {/* Members preview */}
            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground mb-3">
                {selectedContacts.size + 1} members (including you)
              </p>
              <ScrollArea className="h-32">
                <div className="flex flex-wrap gap-3">
                  {selectedContactsList.map(contact => (
                    <div key={contact.user_id} className="flex flex-col items-center gap-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={contact.avatar || undefined} />
                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-center max-w-16 truncate">{contact.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Action buttons */}
            <div className="p-4 border-t mt-auto space-y-2">
              <Button
                onClick={handleCreateGroup}
                disabled={isCreating || !groupName.trim()}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Group'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep('select')}
                className="w-full"
              >
                Back
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>
              {step === 'select' ? 'New Group' : 'Group Details'}
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[600px] p-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle>
            {step === 'select' ? 'New Group' : 'Group Details'}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
