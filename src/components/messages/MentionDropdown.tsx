import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

export interface GroupMember {
  user_id: string;
  name: string;
  avatar?: string | null;
}

interface MentionDropdownProps {
  members: GroupMember[];
  searchQuery: string;
  onSelect: (member: GroupMember) => void;
  position?: { top: number; left: number };
}

export function MentionDropdown({
  members,
  searchQuery,
  onSelect,
  position,
}: MentionDropdownProps) {
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredMembers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-[#2a3942] rounded-lg shadow-lg border border-border z-50 overflow-hidden"
      style={position ? { bottom: 'auto', top: position.top, left: position.left } : undefined}
    >
      <ScrollArea className="max-h-48">
        <div className="py-1">
          {filteredMembers.map((member) => (
            <button
              key={member.user_id}
              onClick={() => onSelect(member)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatar || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">{member.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
