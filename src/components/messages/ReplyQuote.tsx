import { MessageSquare } from "lucide-react";

interface ReplyQuoteProps {
  senderName: string;
  messageSnippet: string;
  onClick?: () => void;
  isSender?: boolean;
}

export function ReplyQuote({ 
  senderName, 
  messageSnippet, 
  onClick,
  isSender = false
}: ReplyQuoteProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left mb-2 px-3 py-2 rounded-lg border-l-4 ${
        isSender 
          ? "border-primary-foreground/50 bg-primary-foreground/10" 
          : "border-primary bg-primary/10"
      } hover:bg-opacity-80 transition-colors`}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 opacity-70" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold opacity-90 truncate">
            {senderName}
          </p>
          <p className="text-xs opacity-70 truncate">
            {messageSnippet}
          </p>
        </div>
      </div>
    </button>
  );
}