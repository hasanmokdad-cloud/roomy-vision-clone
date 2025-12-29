import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  user_id: string;
  name: string;
  avatar?: string | null;
  role: 'Student' | 'Owner' | 'Admin';
}

interface AddGroupMembersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  userId: string | null;
  existingMemberIds: string[];
  onMembersAdded: () => void;
}

export function AddGroupMembersSheet({
  open,
  onOpenChange,
  conversationId,
  userId,
  existingMemberIds,
  onMembersAdded,
}: AddGroupMembersSheetProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open && userId) {
      loadContacts();
    }
  }, [open, userId]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedContacts(new Set());
    }
  }, [open]);

  const loadContacts = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Get all conversations to find contacts
      const { data: conversations } = await supabase
        .from('conversations')
        .select('user_a_id, user_b_id')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .eq('is_group', false);

      if (!conversations) {
        setLoading(false);
        return;
      }

      // Extract unique user IDs (excluding existing members)
      const userIds = new Set<string>();
      conversations.forEach(conv => {
        if (conv.user_a_id && conv.user_a_id !== userId && !existingMemberIds.includes(conv.user_a_id)) {
          userIds.add(conv.user_a_id);
        }
        if (conv.user_b_id && conv.user_b_id !== userId && !existingMemberIds.includes(conv.user_b_id)) {
          userIds.add(conv.user_b_id);
        }
      });

      // Fetch user details
      const contactList: Contact[] = [];
      
      for (const id of userIds) {
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

  const handleAddMembers = async () => {
    if (selectedContacts.size === 0 || !userId) return;

    setAdding(true);

    try {
      const memberInserts = Array.from(selectedContacts).map(contactUserId => ({
        conversation_id: conversationId,
        user_id: contactUserId,
        role: 'member' as const,
        added_by: userId,
      }));

      const { error } = await supabase.from('group_members').insert(memberInserts);

      if (error) throw error;

      toast({ title: `${selectedContacts.size} member(s) added` });
      onMembersAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding members:', error);
      toast({ title: 'Failed to add members', variant: 'destructive' });
    }

    setAdding(false);
  };

  const selectedContactsList = contacts.filter(c => selectedContacts.has(c.user_id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle>Add Members</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 py-3 shrink-0">
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
          <div className="px-4 pb-3 shrink-0">
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
              <div className="text-center py-8 text-muted-foreground">
                {contacts.length === 0 ? 'All contacts are already members' : 'No contacts found'}
              </div>
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

        {/* Add button */}
        <div className="p-4 border-t shrink-0">
          <Button
            onClick={handleAddMembers}
            disabled={selectedContacts.size === 0 || adding}
            className="w-full"
          >
            {adding ? 'Adding...' : `Add ${selectedContacts.size || ''} Member${selectedContacts.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
