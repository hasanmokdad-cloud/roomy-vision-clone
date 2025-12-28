import { Search } from 'lucide-react';

interface FriendSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FriendSearchBar({
  value,
  onChange,
  placeholder = 'Search or start a new chat',
}: FriendSearchBarProps) {
  return (
    <div className="relative">
      <div className="flex items-center bg-[#f0f2f5] rounded-lg px-3 py-2">
        <Search className="h-4 w-4 text-[#54656f] mr-3 shrink-0" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-none text-[15px] text-foreground placeholder:text-[#667781] focus:ring-0 focus:outline-none"
        />
      </div>
    </div>
  );
}
