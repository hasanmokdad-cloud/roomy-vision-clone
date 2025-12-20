import { useIsMobile } from "@/hooks/use-mobile";
import { useReactionUsers } from "@/hooks/useReactionUsers";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface ReactionSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  currentUserId: string;
  initialEmoji?: string;
}

export function ReactionSummarySheet({
  open,
  onOpenChange,
  messageId,
  currentUserId,
  initialEmoji,
}: ReactionSummarySheetProps) {
  const isMobile = useIsMobile();
  const { groupedByEmoji, emojis, isLoading } = useReactionUsers(messageId, currentUserId);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(initialEmoji || null);

  // Filter to show - either selected emoji or all
  const displayUsers = selectedEmoji 
    ? groupedByEmoji[selectedEmoji] || []
    : Object.values(groupedByEmoji).flat();

  const content = (
    <div className="flex flex-col h-full">
      {/* Emoji tabs */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedEmoji(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
            selectedEmoji === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </motion.button>
        {emojis.map((emoji, index) => (
          <motion.button
            key={emoji}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedEmoji(emoji)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 flex items-center gap-1 ${
              selectedEmoji === emoji
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span className="text-base">{emoji}</span>
            <span>{groupedByEmoji[emoji]?.length || 0}</span>
          </motion.button>
        ))}
      </div>

      {/* User list */}
      <ScrollArea className="flex-1 px-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2 pb-4">
              {displayUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>
                        {user.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 text-sm bg-background rounded-full p-0.5 border border-border">
                      {user.emoji}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {user.isCurrentUser ? "You" : user.userName}
                    </p>
                    {selectedEmoji === null && (
                      <p className="text-xs text-muted-foreground">
                        Reacted with {user.emoji}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
              {displayUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No reactions yet
                </p>
              )}
            </div>
          </AnimatePresence>
        )}
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader>
            <DrawerTitle>Reactions</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[60vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Reactions</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
