import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { QuickActionChips } from "./QuickActionChips";
import { FollowUpButtons } from "./FollowUpButtons";

interface ChatMessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  followUpActions?: Array<{ label: string; query: string }>;
  quickChips?: Array<{ label: string; query: string; icon?: string }>;
  onChipClick?: (query: string) => void;
  onFollowUpClick?: (query: string, displayText: string) => void;
}

export function ChatMessageBubble({
  role,
  content,
  timestamp,
  followUpActions,
  quickChips,
  onChipClick,
  onFollowUpClick,
}: ChatMessageBubbleProps) {
  const isUser = role === "user";

  // Sanitize HTML to prevent XSS attacks - only allow safe tags
  const sanitizeHtml = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['strong', 'em', 'p', 'ul', 'li', 'b', 'i'],
      ALLOWED_ATTR: ['class'],
    });
  };

  // Simple markdown-like rendering for assistant messages
  const renderContent = (text: string) => {
    if (isUser) return text;

    // Convert basic markdown
    return text.split("\n").map((line, i) => {
      // Bold text
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      // Sanitize to prevent XSS
      const sanitized = sanitizeHtml(processed);
      
      // Bullet points
      if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
        return (
          <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(sanitized.replace(/^[•-]\s*/, '')) }} />
        );
      }
      // Regular line
      return (
        <p key={i} className={i > 0 ? "mt-2" : ""} dangerouslySetInnerHTML={{ __html: sanitized }} />
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Message Bubble */}
        <div
          className={`
            relative px-4 py-2.5 rounded-2xl
            ${isUser 
              ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-br-md" 
              : "bg-card/90 backdrop-blur-sm border border-border/50 text-foreground rounded-bl-md shadow-sm"
            }
          `}
        >
          <div className={`text-sm leading-relaxed ${!isUser && "prose prose-sm dark:prose-invert max-w-none"}`}>
            {renderContent(content)}
          </div>

          {/* Timestamp */}
          {timestamp && (
            <div className={`text-[10px] mt-1.5 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {format(timestamp, "h:mm a")}
            </div>
          )}
        </div>

        {/* Follow-up Buttons (for assistant messages) */}
        {!isUser && followUpActions && followUpActions.length > 0 && onFollowUpClick && (
          <div className="mt-2">
            <FollowUpButtons
              actions={followUpActions}
              onActionClick={onFollowUpClick}
            />
          </div>
        )}

        {/* Quick Action Chips (for assistant messages) */}
        {!isUser && quickChips && quickChips.length > 0 && onChipClick && (
          <div className="mt-2">
            <QuickActionChips
              chips={quickChips}
              onChipClick={onChipClick}
            />
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
