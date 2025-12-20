import { useUserPresence } from "@/hooks/useUserPresence";
import { formatDistanceToNowStrict, format, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";

interface LastSeenStatusProps {
  userId: string | null;
  isTyping?: boolean;
  isRecording?: boolean;
  fallbackText?: string;
}

export function LastSeenStatus({ 
  userId, 
  isTyping = false, 
  isRecording = false,
  fallbackText 
}: LastSeenStatusProps) {
  const { isOnline, lastSeen } = useUserPresence(userId);

  // Priority: Recording > Typing > Online/LastSeen
  if (isRecording) {
    return (
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-primary flex items-center gap-1"
      >
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Recording audio...
        </motion.span>
      </motion.span>
    );
  }

  if (isTyping) {
    return (
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-primary"
      >
        Typing...
      </motion.span>
    );
  }

  if (isOnline) {
    return (
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-green-500 flex items-center gap-1"
      >
        <motion.span
          className="w-1.5 h-1.5 bg-green-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        Online
      </motion.span>
    );
  }

  if (lastSeen) {
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMs / (1000 * 60 * 60);

    let lastSeenText: string;

    if (diffMinutes < 1) {
      lastSeenText = "Last seen just now";
    } else if (diffMinutes < 60) {
      lastSeenText = `Last seen ${formatDistanceToNowStrict(lastSeen)} ago`;
    } else if (isToday(lastSeen)) {
      lastSeenText = `Last seen today at ${format(lastSeen, "h:mm a")}`;
    } else if (isYesterday(lastSeen)) {
      lastSeenText = `Last seen yesterday at ${format(lastSeen, "h:mm a")}`;
    } else if (diffHours < 168) { // Within a week
      lastSeenText = `Last seen ${format(lastSeen, "EEEE 'at' h:mm a")}`;
    } else {
      lastSeenText = `Last seen ${format(lastSeen, "MMM d, yyyy")}`;
    }

    return (
      <span className="text-xs text-muted-foreground">
        {lastSeenText}
      </span>
    );
  }

  // Fallback
  return fallbackText ? (
    <span className="text-xs text-muted-foreground truncate">
      {fallbackText}
    </span>
  ) : null;
}
