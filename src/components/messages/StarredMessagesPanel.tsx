import { useState, useEffect } from "react";
import { ArrowLeft, MoreVertical, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface StarredMessage {
  id: string;
  body: string | null;
  created_at: string;
  sender_id: string;
}

interface StarredMessagesPanelProps {
  conversationId: string;
  onBack: () => void;
}

export function StarredMessagesPanel({
  conversationId,
  onBack,
}: StarredMessagesPanelProps) {
  const [starredMessages, setStarredMessages] = useState<StarredMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStarredMessages();
  }, [conversationId]);

  const loadStarredMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, body, created_at, sender_id")
        .eq("conversation_id", conversationId)
        .eq("is_starred", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStarredMessages(data || []);
    } catch (error) {
      console.error("Error loading starred messages:", error);
      toast.error("Failed to load starred messages");
    } finally {
      setLoading(false);
    }
  };

  const handleUnstarAll = async () => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_starred: false })
        .eq("conversation_id", conversationId)
        .eq("is_starred", true);

      if (error) throw error;
      
      setStarredMessages([]);
      toast.success("All messages unstarred");
    } catch (error) {
      console.error("Error unstarring all messages:", error);
      toast.error("Failed to unstar messages");
    }
  };

  const handleUnstar = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_starred: false })
        .eq("id", messageId);

      if (error) throw error;
      
      setStarredMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message unstarred");
    } catch (error) {
      console.error("Error unstarring message:", error);
      toast.error("Failed to unstar message");
    }
  };

  return (
    <div className="w-96 border-l border-border bg-background h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Starred messages</h2>
        </div>
        
        {starredMessages.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleUnstarAll} className="text-destructive">
                Unstar all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : starredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <Star className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No starred messages</p>
            <p className="text-sm text-muted-foreground">
              Tap and hold on a message and select "Star" to find it here later
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {starredMessages.map((message) => (
              <div
                key={message.id}
                className="p-4 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm mb-1 break-words">{message.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), "MMM d, yyyy • HH:mm")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => handleUnstar(message.id)}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
