import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { haptics } from "@/utils/haptics";

interface ConversationSearchBarProps {
  open: boolean;
  onClose: () => void;
  messages: Array<{ id: string; body: string | null }>;
  onNavigateToMatch: (messageId: string) => void;
  currentMatchIndex: number;
  setCurrentMatchIndex: (index: number) => void;
  matchingMessageIds: string[];
  setMatchingMessageIds: (ids: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ConversationSearchBar({
  open,
  onClose,
  messages,
  onNavigateToMatch,
  currentMatchIndex,
  setCurrentMatchIndex,
  matchingMessageIds,
  setMatchingMessageIds,
  searchQuery,
  setSearchQuery,
}: ConversationSearchBarProps) {
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Search through messages
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchingMessageIds([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = messages
      .filter(m => m.body && m.body.toLowerCase().includes(query))
      .map(m => m.id);

    setMatchingMessageIds(matches);
    
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
      onNavigateToMatch(matches[0]);
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [searchQuery, messages]);

  const navigateUp = useCallback(() => {
    if (matchingMessageIds.length === 0) return;
    
    const newIndex = currentMatchIndex > 0 
      ? currentMatchIndex - 1 
      : matchingMessageIds.length - 1;
    
    setCurrentMatchIndex(newIndex);
    onNavigateToMatch(matchingMessageIds[newIndex]);
    haptics.light();
  }, [currentMatchIndex, matchingMessageIds, onNavigateToMatch, setCurrentMatchIndex]);

  const navigateDown = useCallback(() => {
    if (matchingMessageIds.length === 0) return;
    
    const newIndex = currentMatchIndex < matchingMessageIds.length - 1 
      ? currentMatchIndex + 1 
      : 0;
    
    setCurrentMatchIndex(newIndex);
    onNavigateToMatch(matchingMessageIds[newIndex]);
    haptics.light();
  }, [currentMatchIndex, matchingMessageIds, onNavigateToMatch, setCurrentMatchIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        navigateUp();
      } else {
        navigateDown();
      }
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setMatchingMessageIds([]);
    setCurrentMatchIndex(-1);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 px-3 py-2 bg-background border-b border-border"
      >
        {/* Search icon */}
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />

        {/* Input */}
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search in conversation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
        />

        {/* Results count */}
        {searchQuery && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {matchingMessageIds.length === 0 
              ? 'No results' 
              : `${currentMatchIndex + 1} of ${matchingMessageIds.length}`
            }
          </span>
        )}

        {/* Navigation buttons */}
        {matchingMessageIds.length > 0 && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateUp}
              className="h-8 w-8"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateDown}
              className="h-8 w-8"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper component to highlight search matches in message text
interface HighlightedTextProps {
  text: string;
  searchQuery: string;
  isCurrentMatch?: boolean;
}

export function HighlightedText({ 
  text, 
  searchQuery, 
  isCurrentMatch = false 
}: HighlightedTextProps) {
  if (!searchQuery.trim()) {
    return <>{text}</>;
  }

  const query = searchQuery.toLowerCase();
  const parts: { text: string; isMatch: boolean }[] = [];
  let lastIndex = 0;
  const lowerText = text.toLowerCase();
  let matchIndex = lowerText.indexOf(query, lastIndex);

  while (matchIndex !== -1) {
    // Add non-matching part before this match
    if (matchIndex > lastIndex) {
      parts.push({ 
        text: text.slice(lastIndex, matchIndex), 
        isMatch: false 
      });
    }
    
    // Add the matching part
    parts.push({ 
      text: text.slice(matchIndex, matchIndex + query.length), 
      isMatch: true 
    });
    
    lastIndex = matchIndex + query.length;
    matchIndex = lowerText.indexOf(query, lastIndex);
  }

  // Add remaining non-matching part
  if (lastIndex < text.length) {
    parts.push({ 
      text: text.slice(lastIndex), 
      isMatch: false 
    });
  }

  return (
    <>
      {parts.map((part, index) => 
        part.isMatch ? (
          <mark 
            key={index}
            className={`px-0.5 rounded ${
              isCurrentMatch 
                ? 'bg-orange-400 text-foreground' 
                : 'bg-yellow-300/70 text-foreground'
            }`}
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}
