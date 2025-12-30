import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Video, FileText, Calendar, User, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export type MediaFilterType = 'all' | 'photos' | 'videos' | 'documents';

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface SenderOption {
  id: string;
  name: string;
  photo?: string;
}

interface SearchFilterPanelProps {
  mediaFilter: MediaFilterType;
  onMediaFilterChange: (filter: MediaFilterType) => void;
  dateRange: DateRangeFilter;
  onDateRangeChange: (range: DateRangeFilter) => void;
  senderFilter: string | null;
  onSenderFilterChange: (senderId: string | null) => void;
  senderOptions: SenderOption[];
  onClearFilters: () => void;
}

const mediaOptions: { value: MediaFilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'photos', label: 'Photos', icon: <Image className="w-4 h-4" /> },
  { value: 'videos', label: 'Videos', icon: <Video className="w-4 h-4" /> },
  { value: 'documents', label: 'Docs', icon: <FileText className="w-4 h-4" /> },
];

const quickDateOptions = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'This Week', getValue: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { from: start, to: now };
  }},
  { label: 'This Month', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start, to: now };
  }},
];

export const SearchFilterPanel = ({
  mediaFilter,
  onMediaFilterChange,
  dateRange,
  onDateRangeChange,
  senderFilter,
  onSenderFilterChange,
  senderOptions,
  onClearFilters,
}: SearchFilterPanelProps) => {
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);

  const hasActiveFilters = mediaFilter !== 'all' || dateRange.from || dateRange.to || senderFilter;

  const selectedSender = senderOptions.find(s => s.id === senderFilter);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-4 pb-4 border-b border-border/50"
    >
      {/* Media Type Filter */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Media Type
        </label>
        <div className="flex gap-2 flex-wrap">
          {mediaOptions.map((option) => (
            <Button
              key={option.value}
              variant={mediaFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMediaFilterChange(option.value)}
              className={cn(
                "gap-1.5 transition-all",
                mediaFilter === option.value && "bg-primary text-primary-foreground"
              )}
            >
              {option.icon}
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Date Range
        </label>
        <div className="flex gap-2 flex-wrap mb-2">
          {quickDateOptions.map((option) => (
            <Button
              key={option.label}
              variant="ghost"
              size="sm"
              onClick={() => onDateRangeChange(option.getValue())}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <Popover open={showFromCalendar} onOpenChange={setShowFromCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 flex-1 justify-start">
                <Calendar className="w-4 h-4" />
                {dateRange.from ? format(dateRange.from, 'MMM d, yyyy') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <CalendarComponent
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => {
                  onDateRangeChange({ ...dateRange, from: date });
                  setShowFromCalendar(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">to</span>
          <Popover open={showToCalendar} onOpenChange={setShowToCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 flex-1 justify-start">
                <Calendar className="w-4 h-4" />
                {dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <CalendarComponent
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => {
                  onDateRangeChange({ ...dateRange, to: date });
                  setShowToCalendar(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Sender Filter */}
      {senderOptions.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Sender
          </label>
          <Select
            value={senderFilter || 'all'}
            onValueChange={(value) => onSenderFilterChange(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue>
                {selectedSender ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={selectedSender.photo} />
                      <AvatarFallback className="text-xs">
                        {selectedSender.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedSender.name}</span>
                  </div>
                ) : (
                  'All senders'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All senders</SelectItem>
              {senderOptions.map((sender) => (
                <SelectItem key={sender.id} value={sender.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={sender.photo} />
                      <AvatarFallback className="text-xs">
                        {sender.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{sender.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Clear Filters */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-destructive hover:text-destructive gap-1.5"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
