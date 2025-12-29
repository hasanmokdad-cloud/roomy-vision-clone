import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Ban, UserX } from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BlockedUser {
  id: string;
  blocked_user_id: string;
  created_at: string;
  user_name?: string;
  user_photo?: string | null;
}

export default function BlockedUsers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);

  useEffect(() => {
    if (user) {
      loadBlockedUsers();
    }
  }, [user]);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      
      // First get all blocked user IDs
      const { data: blocks, error: blocksError } = await supabase
        .from('user_blocks')
        .select('*')
        .eq('blocker_user_id', user?.id);

      if (blocksError) throw blocksError;

      if (!blocks || blocks.length === 0) {
        setBlockedUsers([]);
        return;
      }

      // Get user details for each blocked user
      const blockedUserIds = blocks.map(b => b.blocked_user_id);
      
      // Try to get from students table first
      const { data: students } = await supabase
        .from('students')
        .select('user_id, full_name, profile_photo_url')
        .in('user_id', blockedUserIds);

      // Then from owners table
      const { data: owners } = await supabase
        .from('owners')
        .select('user_id, full_name, profile_photo_url')
        .in('user_id', blockedUserIds);

      // Combine and map
      const userMap = new Map<string, { name: string; photo: string | null }>();
      
      students?.forEach(s => {
        userMap.set(s.user_id, { name: s.full_name, photo: s.profile_photo_url });
      });
      
      owners?.forEach(o => {
        if (!userMap.has(o.user_id)) {
          userMap.set(o.user_id, { name: o.full_name, photo: o.profile_photo_url });
        }
      });

      const enrichedBlocks: BlockedUser[] = blocks.map(block => ({
        id: block.id,
        blocked_user_id: block.blocked_user_id,
        created_at: block.created_at,
        user_name: userMap.get(block.blocked_user_id)?.name || 'Unknown User',
        user_photo: userMap.get(block.blocked_user_id)?.photo || null,
      }));

      setBlockedUsers(enrichedBlocks);
    } catch (error: any) {
      console.error('Error loading blocked users:', error);
      toast({
        title: "Error",
        description: "Failed to load blocked users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!selectedUser) return;
    
    try {
      setUnblockingId(selectedUser.id);
      
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      toast({ title: `${selectedUser.user_name} unblocked` });
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    } finally {
      setUnblockingId(null);
      setShowUnblockDialog(false);
      setSelectedUser(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Blocked Users</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : blockedUsers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <UserX className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No blocked users</h3>
            <p className="text-muted-foreground text-sm">
              When you block someone, they'll appear here
            </p>
          </motion.div>
        ) : (
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="space-y-2">
              {blockedUsers.map((blockedUser, index) => (
                <motion.div
                  key={blockedUser.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={blockedUser.user_photo || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {blockedUser.user_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{blockedUser.user_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Blocked on {formatDate(blockedUser.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(blockedUser);
                      setShowUnblockDialog(true);
                    }}
                    disabled={unblockingId === blockedUser.id}
                    className="text-primary hover:text-primary"
                  >
                    {unblockingId === blockedUser.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    ) : (
                      'Unblock'
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Info section */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">About blocking</p>
                  <p>Blocked users won't be able to:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Send you messages</li>
                    <li>See your online status</li>
                    <li>View your profile</li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Unblock confirmation dialog */}
      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock {selectedUser?.user_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be able to send you messages and see your online status again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock}>
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
