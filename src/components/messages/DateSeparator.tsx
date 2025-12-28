import { format, isToday, isYesterday, subDays, isWithinInterval } from 'date-fns';

interface DateSeparatorProps {
  date: Date;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const getDateLabel = (): string => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    
    const today = new Date();
    const weekAgo = subDays(today, 7);
    
    if (isWithinInterval(date, { start: weekAgo, end: today })) {
      return format(date, "EEEE"); // "Tuesday"
    }
    
    return format(date, "MMMM d, yyyy"); // "December 25, 2024"
  };

  return (
    <div className="flex justify-center my-3">
      <div className="px-3 py-1 rounded-lg bg-white/90 dark:bg-[#182229]/90 backdrop-blur-sm shadow-sm">
        <span className="text-[12px] text-[#54656f] dark:text-[#8696a0] font-medium">
          {getDateLabel()}
        </span>
      </div>
    </div>
  );
}
