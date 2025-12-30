import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MentionDropdown, GroupMember } from './MentionDropdown';
import { AnimatePresence } from 'framer-motion';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  groupMembers?: GroupMember[];
  isGroupChat?: boolean;
}

export function MentionInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
  className,
  groupMembers = [],
  isGroupChat = false,
}: MentionInputProps) {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);

    // Only check for mentions in group chats
    if (!isGroupChat) {
      setShowMentionDropdown(false);
      return;
    }

    // Find @ symbol before cursor
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's a space before @ or it's at the start
      const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' ';
      
      if ((charBeforeAt === ' ' || lastAtIndex === 0) && !textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        setShowMentionDropdown(true);
        return;
      }
    }
    
    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
  }, [isGroupChat, onChange]);

  const handleMemberSelect = useCallback((member: GroupMember) => {
    if (mentionStartIndex === -1) return;

    // Replace @query with @[Name](user_id)
    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(mentionStartIndex + mentionQuery.length + 1);
    const mentionText = `@[${member.name}](${member.user_id}) `;
    
    onChange(beforeMention + mentionText + afterMention);
    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
    
    // Focus back to input
    inputRef.current?.focus();
  }, [mentionStartIndex, mentionQuery, value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showMentionDropdown && e.key === 'Escape') {
      e.preventDefault();
      setShowMentionDropdown(false);
      return;
    }
    
    onKeyDown?.(e);
  }, [showMentionDropdown, onKeyDown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMentionDropdown(false);
    };

    if (showMentionDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMentionDropdown]);

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        aria-label="Message input"
      />
      
      <AnimatePresence>
        {showMentionDropdown && groupMembers.length > 0 && (
          <MentionDropdown
            members={groupMembers}
            searchQuery={mentionQuery}
            onSelect={handleMemberSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility function to parse mentions from message text
export function parseMentions(text: string): { text: string; mentions: { userId: string; name: string; start: number; end: number }[] } {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: { userId: string; name: string; start: number; end: number }[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      name: match[1],
      userId: match[2],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  return { text, mentions };
}

// Render message with highlighted mentions
export function renderMentionedText(
  text: string,
  currentUserId: string,
  onMentionClick?: (userId: string) => void
): React.ReactNode[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(<span key={keyIndex++}>{text.slice(lastIndex, match.index)}</span>);
    }

    const [, name, userId] = match;
    const isCurrentUser = userId === currentUserId;

    parts.push(
      <button
        key={keyIndex++}
        onClick={() => onMentionClick?.(userId)}
        className={`inline font-medium ${
          isCurrentUser
            ? 'text-primary bg-primary/10 px-1 rounded'
            : 'text-primary hover:underline'
        }`}
      >
        @{name}
      </button>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={keyIndex++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
}
