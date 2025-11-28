import { format } from 'date-fns';

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
}

/**
 * Format date for ICS file (YYYYMMDDTHHMMSS)
 */
function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generate ICS file content
 */
export function generateICSFile(event: CalendarEvent): string {
  const startDateFormatted = formatICSDate(event.startDate);
  const endDateFormatted = formatICSDate(event.endDate);
  const now = formatICSDate(new Date());
  
  // Escape special characters for ICS format
  const escapeICS = (str: string) => {
    return str.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Roomy//Tour Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${startDateFormatted}`,
    `DTEND:${endDateFormatted}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(event.location)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = formatICSDate(event.startDate);
  const endDate = formatICSDate(event.endDate);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const baseUrl = 'https://outlook.office.com/calendar/0/deeplink/compose';
  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    body: event.description,
    location: event.location,
    path: '/calendar/action/compose',
    rru: 'addevent'
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Trigger download of ICS file
 */
export function downloadICSFile(event: CalendarEvent, filename: string = 'roomy-tour.ics'): void {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Create calendar event from booking details
 */
export function createCalendarEventFromBooking(booking: {
  dorm_name?: string;
  student_name?: string;
  owner_name?: string;
  requested_date: string;
  requested_time: string;
  meeting_link?: string;
  message?: string;
  owner_notes?: string;
  id: string;
}): CalendarEvent {
  const [hours, minutes] = booking.requested_time.split(':');
  const startDate = new Date(booking.requested_date);
  startDate.setHours(parseInt(hours), parseInt(minutes), 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration
  
  const description = [
    `Roomy Virtual Tour`,
    booking.student_name ? `Student: ${booking.student_name}` : '',
    booking.owner_name ? `Owner: ${booking.owner_name}` : '',
    booking.message ? `Message: ${booking.message}` : '',
    booking.owner_notes ? `Notes: ${booking.owner_notes}` : '',
    booking.meeting_link ? `Meeting Link: ${booking.meeting_link}` : '',
    `Booking ID: ${booking.id}`,
    '',
    'Powered by Roomy - Your Student Housing Platform'
  ].filter(Boolean).join('\n');
  
  return {
    title: `Roomy Virtual Tour – ${booking.dorm_name || 'Property Tour'}`,
    description,
    startDate,
    endDate,
    location: booking.meeting_link || 'Meeting link to be provided',
  };
}
