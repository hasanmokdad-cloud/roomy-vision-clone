import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Download, Apple } from 'lucide-react';
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl, downloadICSFile, createCalendarEventFromBooking } from '@/lib/calendarUtils';

interface AddToCalendarDropdownProps {
  booking: {
    dorm_name?: string;
    student_name?: string;
    owner_name?: string;
    requested_date: string;
    requested_time: string;
    meeting_link?: string;
    meeting_platform?: string;
    message?: string;
    owner_notes?: string;
    id: string;
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function AddToCalendarDropdown({
  booking,
  variant = 'outline',
  size = 'default'
}: AddToCalendarDropdownProps) {
  const handleAddToGoogleCalendar = () => {
    const event = createCalendarEventFromBooking(booking);
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddToOutlookCalendar = () => {
    const event = createCalendarEventFromBooking(booking);
    const url = generateOutlookCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadICS = () => {
    const event = createCalendarEventFromBooking(booking);
    const filename = `roomy-tour-${booking.id.substring(0, 8)}.ics`;
    downloadICSFile(event, filename);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Calendar className="w-4 h-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleAddToGoogleCalendar} className="gap-2 cursor-pointer">
          <Calendar className="w-4 h-4" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToOutlookCalendar} className="gap-2 cursor-pointer">
          <Calendar className="w-4 h-4" />
          Outlook Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS} className="gap-2 cursor-pointer">
          <Apple className="w-4 h-4" />
          Apple Calendar (.ics)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS} className="gap-2 cursor-pointer">
          <Download className="w-4 h-4" />
          Download .ICS File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
