import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Send, X, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  body: string | null;
  attachment_type?: string | null;
  attachment_url?: string | null;
  attachment_duration?: number | null;
}

interface Conversation {
  id: string;
  other_user_name: string;
  other_user_photo: string | null;
  last_message_time?: string;
}

interface ForwardMessageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  onForwardComplete?: () => void;
}

export function ForwardMessageSheet({
  open,
  onOpenChange,
  messages,
  onForwardComplete,
}: ForwardMessageSheetProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { userId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Load conversations
  useEffect(() => {
    if (open && userId) {
      loadConversations();
    }
  }, [open, userId]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setSelectedConversations(new Set());
      setSearchQuery("");
    }
  }, [open]);

  const loadConversations = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Get conversations where user is a participant
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .or('is_archived.is.null,is_archived.eq.false')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Enrich with user names
      const enriched = await Promise.all((data || []).map(async (conv) => {
        const otherUserId = conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id;
        
        // Try student first
        const { data: studentData } = await supabase
          .from('students')
          .select('full_name, profile_photo_url')
          .eq('user_id', otherUserId)
          .maybeSingle();

        if (studentData) {
          return {
            id: conv.id,
            other_user_name: studentData.full_name || 'User',
            other_user_photo: studentData.profile_photo_url,
            last_message_time: conv.updated_at,
          };
        }

        // Try owner
        const { data: ownerData } = await supabase
          .from('owners')
          .select('full_name, profile_photo_url')
          .eq('user_id', otherUserId)
          .maybeSingle();

        if (ownerData) {
          return {
            id: conv.id,
            other_user_name: ownerData.full_name || 'Owner',
            other_user_photo: ownerData.profile_photo_url,
            last_message_time: conv.updated_at,
          };
        }

        // Try admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('full_name, profile_photo_url')
          .eq('user_id', otherUserId)
          .maybeSingle();

        return {
          id: conv.id,
          other_user_name: adminData?.full_name || 'User',
          other_user_photo: adminData?.profile_photo_url || null,
          last_message_time: conv.updated_at,
        };
      }));

      setConversations(enriched);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter(c => 
      c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const toggleConversation = (id: string) => {
    setSelectedConversations(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleForward = async () => {
    if (!userId || selectedConversations.size === 0 || messages.length === 0) return;

    setIsSending(true);
    try {
      // Forward each message to each selected conversation
      for (const conversationId of selectedConversations) {
        for (const message of messages) {
          const forwardedBody = message.body 
            ? `↪️ Forwarded:\n${message.body}`
            : null;

          await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: userId,
            body: forwardedBody,
            attachment_type: message.attachment_type,
            attachment_url: message.attachment_url,
            attachment_duration: message.attachment_duration,
            attachment_metadata: { forwarded: true, original_message_id: message.id },
            status: 'sent',
          });
        }

        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }

      const messageCount = messages.length;
      const chatCount = selectedConversations.size;
      
      toast({
        title: "Message forwarded",
        description: `${messageCount} message${messageCount > 1 ? 's' : ''} sent to ${chatCount} chat${chatCount > 1 ? 's' : ''}`,
      });

      onOpenChange(false);
      onForwardComplete?.();
    } catch (error: any) {
      console.error('Forward error:', error);
      toast({
        title: "Forward failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Selected count */}
      {selectedConversations.size > 0 && (
        <div className="px-4 py-2 bg-primary/5 border-b border-border">
          <p className="text-sm text-primary font-medium">
            {selectedConversations.size} chat{selectedConversations.size > 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="py-2">
            {/* Frequently contacted section */}
            {!searchQuery && (
              <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recent Chats
              </p>
            )}
            
            {filteredConversations.map((conv) => {
              const isSelected = selectedConversations.has(conv.id);
              
              return (
                <motion.button
                  key={conv.id}
                  onClick={() => toggleConversation(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Avatar with checkmark overlay */}
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.other_user_photo || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {conv.other_user_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Name */}
                  <div className="flex-1 text-left">
                    <p className="font-medium">{conv.other_user_name}</p>
                  </div>

                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleConversation(conv.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </motion.button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Send button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={handleForward}
          disabled={selectedConversations.size === 0 || isSending}
          className="w-full gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Forward to {selectedConversations.size || ''} chat{selectedConversations.size !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] p-0">
          <SheetHeader className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle>Forward to...</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 max-h-[80vh] flex flex-col">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle>Forward to...</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
