import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FriendsTab } from '@/components/friends/FriendsTab';

interface FriendsProfileTabProps {
  studentId: string;
}

export function FriendsProfileTab({ studentId }: FriendsProfileTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-[32px] font-bold text-[#222222] font-sans">
        Friends
      </h2>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717171]" />
        <Input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 py-3 border-[#DDDDDD] rounded-full text-base focus:border-[#222222] focus:ring-0"
        />
      </div>

      {/* Friends Content */}
      <div className="bg-white rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] overflow-hidden">
        <FriendsTab 
          studentId={studentId} 
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
